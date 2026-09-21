Max Bolingbroke has done a wonderful job on adding Constraint kinds to GHC.

Constraint Kinds adds a new kind `Constraint`, such that `Eq :: * -> Constraint`, `Monad :: (* -> *) -> Constraint`, but since it is a kind, we can make type families for constraints, and even parameterize constraints *on* constraints.

So, let's play with them and see what we can come up with!

## A Few Extensions

First, we'll need a few language features:

```haskell
{-# LANGUAGE
  CPP,
  ScopedTypeVariables,
  FlexibleInstances,
  FlexibleContexts,
  ConstraintKinds,
  KindSignatures,
  TypeOperators,
  FunctionalDependencies,
  Rank2Types,
  StandaloneDeriving,
  GADTs
  #-}
```

Because of the particular version of GHC I'm using I'll also need

```haskell
{-# LANGUAGE UndecidableInstances #-}
#define UNDECIDABLE
```

but this bug has been fixed in the current version of GHC Head. I'll be explicit about any instances that need UndecidableInstances by surrounding them in an `#ifdef UNDECIDABLE` block.

## Explicit Dictionaries

So with that out of the way, let's import some definitions

```haskell
import Control.Monad
import Control.Monad.Instances
import Control.Applicative
import Data.Monoid
import Data.Complex
import Data.Ratio
import Unsafe.Coerce
```

and make one of our own that shows what we get out of making Constraints into a kind we can manipulate like any other.

```haskell
data Dict a where
  Dict :: a => Dict a
```

Previously, we coud make a Dict like data type for any one particular class constraint that we wanted to capture, but now we can write this type once and for all. The act of pattern matching on the Dict constructor will bring the constraint 'a' into scope.

Of course, in the absence of incoherent and overlapping instances there is at most one dictionary of a given type, so we could make instances, like we can for any other data type, but standalone deriving is smart enough to figure these out for me. (Thanks copumpkin!)

```haskell
deriving instance Eq (Dict a)
deriving instance Ord (Dict a)
deriving instance Show (Dict a)
```

If we're willing to turn on UndecidableInstances to enable the polymorphic constraint we can even add:

```haskell
#ifdef UNDECIDABLE
deriving instance a => Read (Dict a)
instance a => Monoid (Dict a) where
  mappend Dict Dict = Dict
  mempty = Dict
#endif
```

and similar polymorphically constrained instances for `Enum`, `Bounded`, etc.

## Entailment

For that we'll need a notion of entailment.

```haskell
infixr 9 :-
newtype a :- b = Sub (a => Dict b)

instance Eq (a :- b) where
  _ == _ = True

instance Ord (a :- b) where
  compare _ _ = EQ

instance Show (a :- b) where
  showsPrec d _ = showParen (d > 10) $
    showString "Sub Dict"
```

Here we're saying that `Sub` takes one argument, which is a computation that when implicitly given a constraint of type *a*, can give me back a dictionary for the type *b*. Moreover, as a newtype it adds no overhead that isn't aleady present in manipulating terms of type (a => Dict b) directly.

The simplest thing we can define with this is that entailment is reflexive.

```haskell
refl :: a :- a
refl = Sub Dict
```

Max has already written up a nice restricted monad example using these, but what I want to play with today is the category of substitutability of constraints, but there are a few observations I need to make, first.

ConstraintKinds overloads `()` and `(a,b)` to represent the trivial constraint and the product of two constraints respectively.

The latter is done with a bit of a hack, which we'll talk about in a minute, but we can use the former as a terminal object for our category of entailments.

```haskell
weaken1 :: (a, b) :- a
weaken1 = Sub Dict

weaken2 :: (a, b) :- b
weaken2 = Sub Dict
```

Constraints are idempotent, so we can duplicate one, perhaps as a prelude to transforming one of them into something else.

```haskell
contract :: a :- (a, a)
contract = Sub Dict
```

But to do much more complicated, we're going to need a notion of substitution, letting us use our entailment relation to satisfy obligations.

```haskell
infixl 1 \\ -- required comment
(\\) :: a => (b => r) -> (a :- b) -> r
r \\ Sub Dict = r
```

The type says that given that a constraint *a* can be satisfied, a computation that needs a constraint of type *b* to be satisfied in order to obtain a result, and the fact that *a* entails *b*, we can compute the result.

The constraint *a* is satisfied by the type signature, and the fact that we get quietly passed whatever dictionary is needed. Pattern matching on Sub brings into scope a computation of type `(a => Dict b)`, and we are able to discharge the *a* obligation, using the dictionary we were passed, Pattern matching on `Dict` forces that computation to happen and brings b into scope, allowing us to meet the obligation of the computation of r. All of this happens for us behind the scenes just by pattern matching.

So what can we do with this?

We can use \\\\ to compose constraints.

```haskell
trans :: (b :- c) -> (a :- b) -> a :- c
trans f g = Sub $ Dict \\ f \\ g
```

In fact, the way the dictionaries get plumbed around inside the argument to Sub is rather nice, because we can give that same definition different type signatures, letting us make (,) more product-like, giving us the canonical product morphism to go with the weakenings/projections we defined above.

```haskell
(&&&) :: (a :- b) -> (a :- c) -> a :- (b, c)
f &&& g = Sub $ Dict \\ f \\ g
```

And since we're using it as a product, we can make it act like a bifunctor also using the same definition.

```haskell
(***) :: (a :- b) -> (c :- d) -> (a, c) :- (b, d)
f *** g = Sub $ Dict \\ f \\ g
```

## Limited Sub-Superkinding?

Ideally we'd be able to capture something like that bifunctoriality using a type like

```haskell
#if 0
class BifunctorS (p :: Constraint -> Constraint -> Constraint) where
  bimapS :: (a :- b) -> (c :- d) -> p a c :- p b d
#endif
```

In an even more ideal world, it would be enriched using something like

```haskell
#ifdef POLYMORPHIC_KINDS
class Category (k :: x -> x -> *) where
  id :: k a a
  (.) :: k b c -> k a b -> k a c
instance Category (:-) where
  id = refl
  (.) = trans
#endif
```

where x is a **kind variable**, then we could obtain a more baroque and admittedly far less thought-out bifunctor class like:

```haskell
#if 0
class Bifunctor (p :: x -> y -> z) where
  type Left p :: x -> x -> *
  type Left p = (->)
  type Right p :: y -> y -> *
  type Right p = (->)
  type Cod p :: z -> z -> *
  type Cod p = (->)
  bimap :: Left p a b -> Right p c d -> Cod p (p a c) (p b d)
#endif
```

Or even more more ideally, you could use the fact that we can directly define product categories!

Since they are talking about kind-indexing for classes and type families, we could have separate bifunctors for (,) for both kinds \* and Constraint.

The current constraint kind code uses a hack to let (a,b) be used as a type inhabiting \* and as the syntax for constraints. This hack is limited however. It only works when the type (,) is fully applied to its arguments. Otherwise you'd wind up with the fact that the type (,) needs to have both of these kinds:

```haskell
-- (,) :: Constraint -> Constraint -> Constraint and
-- (,) :: * -> * -> *
```

What is currently done is that the kind magically switches for `()` and `(,)` in certain circumstances. GHC already had some support for this because it parses `(Foo a, Bar b)` as a type in `(Foo a, Bar b) => Baz a b` before transforming it into a bunch of constraints.

Since we already have a notion of sub-kinding at the kind level, we could solve this for `()` by making up a new kind, say, `???` which is the subkind of both `*` and `Constraint`, but this would break the nice join lattice properties of the current system.

\[Edit: in the initial draft, I had said superkind\]

```haskell
--    ?
--   / \
-- (#)  ??
--     /  \
--    #    *  Constraint
--          \ /
--          ???
```

But this doesn't address the kind of `(,)` above. With the new polymorphic kinds that Brent Yorgey and company have been working on and a limited notion of sub-superkinding, this could be resolved by making a new super-kind `@` that is the super-kind of both `*` and `Constraint`, and which is a sub-superkind of the usual unnamed Box superkind.

```haskell
-- Box
--  |
--  @
```

Then we can have:

```haskell
-- (,) :: forall (k :: @). k -> k -> k
-- () :: forall (k :: @). k
```

and kind checking/inference will do the right thing about keeping the kind ambiguous for types like `(,) () :: forall (k :: @). k`

This would get rid of the hack and let me make a proper bifunctor for `(,)` in the category of entailments.

The version of GHC head I'm working with right now doesn't support polymorphic kinds, so I've only been playing with these in a toy type checker, but I'm really looking forward to being able to have product categories!

## Stay Tuned

[Next](http://comonad.com/reader/2011/what-constraints-entail-part-2/), we'll go over how to reflect the class and instance declarations so we can derive entailment of a superclass for a class, and the entailment of instances.

\[[Source](https://github.com/ekmett/constraints/blob/master/Data/Constraint.hs)\]
