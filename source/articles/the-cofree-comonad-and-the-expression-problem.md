```haskell
{-# OPTIONS -fglasgow-exts -fallow-undecidable-instances #-}
import Control.Monad
import Control.Monad.Identity
import Control.Arrow ((&&&), (***),(+++), (|||))
```

I want to talk about duality briefly. I don't want to go all the way to [Filinski](http://citeseer.ist.psu.edu/filinski89declarative.html)\-style or [Haskell is Not Not ML](http://research.microsoft.com/users/simonpj/papers/not-not-ml/index.htm)\-style value/continuation duality, but I do want to poke a bit at the variant/record duality explified by the extensible cases used to handle variants in [MLPolyR](http://ttic.uchicago.edu/~wchae/wiki/pmwiki.php).

The need for extensible cases to handle open variants is part of the expression problem as stated by Wadler:

> The goal is to define a data type by cases, where one can add new cases to the data type and new functions over the data type, without recompiling existing code, and while retaining static type safety.

One obvious trick is to use an extensible record of functions as a 'case' statement, with each field corresponding to one of the variants. To index into records you can use an extensible variant of functions to represent a field selection. In a purer form ala the Filinski or the Haskell is Not Not ML approach mentioned above, you can replace the word 'function' with continuation and everything works out.

Sweirstra recently tackled the extensible variant side of the equation with in [Data types a la carte](http://www.cs.nott.ac.uk/~wss/Publications/DataTypesALaCarte.pdf) using the free monad coproduct to handle the 'variant' side of things, leaving the handling of cases to typeclasses, but we can see if we can go one better and just exploit the variant/record duality directly.

## Fight Club for Functors

Leaning a little on multi-parameter type classes we define:

```haskell
class Dual f g | f -> g, g -> f where
  zap :: (a -> b -> c) -> f a -> g b -> c

(>$< ) :: Dual f g => f (a -> b) -> g a -> b
(>$< ) = zap id
```

The (>$<) operator takes a functor containing functions, and its 'dual functor' and annihilates them both obtaining a single value in a deterministic fashion.

The easiest inhabitant of this typeclass is the following:

```haskell
instance Dual Identity Identity where
  zap f (Identity a) (Identity b) = f a b
```

After all there is only one item to be had on both the left and right so the choice is obvious. Now, we can take a couple of additional functors, the coproduct and product functors and define instances of Dual for them:

```haskell
data (f :+: g) a = Inl (f a) | Inr (g a)
data (f :*: g) a = Prod (f a) (g a)

instance (Functor f, Functor g) => Functor (f :+: g) where
  fmap f (Inl x) = Inl (fmap f x)
  fmap f (Inr y) = Inr (fmap f y)

instance (Functor f, Functor g) => Functor (f :+: g) where
  fmap f (Prod x y) = Prod (fmap f x) (fmap f y)

instance (Dual f f', Dual g g') => Dual (f :+: g) (f' :*: g') where
  zap op (Inl f) (Prod a _) = zap op f a
  zap op (Inr f) (Prod _ b) = zap op f b

instance (Dual f f', Dual g g') => Dual (f :*: g) (f' :+: g') where
  zap op (Prod f _) (Inl a) = zap op f a
  zap op (Prod _ g) (Inr b) = zap op g b
```

Now, we can use the above to define an extensible case using (:\*:)'s to handle any matching variant (:+:).

Clearly if you use any composition of the above, what will happen is whenever you have a product on the left you will have a sum on the right 'choosing' which half of the product you are interested, and whenever you have a sum on the left you will have a product on the right, and the sum in THAT case will choose which half of the product you are interested in. You will eventually reach a leaf (or evaluate to bottom), and the only base case we have is the Identity functor on both sides, so you will have only one candidate value to return.

The 'dispatch' of the function call is handled by some choices being made by sums on the left and others being made by sums on the right, but always in order to preserve duality, there is a corresponding pair of options on the other side.

A more straightforward insight might be obtained by extending this logic to bifunctors to eliminate some of the noise and allow your types to vary more.

```haskell
-- | Bifunctor Duality
class BiDual p q | p -> q, q -> p where
  bizap :: (a -> c -> e) -> (b -> d -> e) -> p a b -> q c d -> e

(>>$< <):: BiDual p q => p (a -> c) (b -> c) -> q a b -> c
(>>$< <) = bizap id id

instance BiDual (,) Either where
  bizap l r (f,g) (Left a)  = l f a
  bizap l r (f,g) (Right b) = r g b

instance BiDual Either (,) where
  bizap l r (Left f) (a,b)  = l f a
  bizap l r (Right g) (a,b) = r g b
```

With the latter definition in hand, we can use products of functions to annihilate sums of values, or sums of functions to annihilate products of values.

```haskell
ten :: Int
ten = ((*2),id) >>$< < Left 5

four :: Int
four = Left (/2) >>$< < (8.0, True)
```

We can use the earlier definitions to define the different algebra instances used by Swierstra as functions as a product of functions thereby decoupling us from the typeclass machinery.

I'll leave this bit as an exercise for the reader. The translation is pretty much straightforward.

\[Edit: See a simple worked example in the comments\]

*However*, the catamorphism used in the a la Carte paper to deconstruct the free monad with an initial algebra is not the only way you may want to take a free monad apart!

We can also use the cofree comonad of its dual functor, exploiting the same duality we used above to construct the algebra itself. And similarly we can stick a bunch of functions in the free monad of a the dual of a functor to pick a value out of a cofree comonad.

Where the a la Carte paper approach let you carry around different variants, the cofree comonad product construction allows you to 'carry around more stuff in each one.' The record/variant stuff has been around since Oleg et al.'s [HList](http://darcs.haskell.org/HList/)/[OOHaskell](http://homepages.cwi.nl/~ralf/OOHaskell/) stuff, but I don't recall seeing records of functions used to handle variants in that setting. I'm sure someone will correct me with a 15 year old example.

Recall the relevant portions of the free monad and cofree comonad:

```haskell
newtype Cofree f a = Cofree { runCofree :: (a, f (Cofree f a)) }
newtype Free f a = Free { runFree :: Either a (f (Free f a)) }

instance Functor f => Functor (Cofree f) where
  fmap f = Cofree . (f *** fmap (fmap f)) . runCofree
instance Functor f => Functor (Free f) where
  fmap f = Free . (f +++ fmap (fmap f)) . runFree

anaC :: Functor f => (a -> f a) -> a -> Cofree f a
anaC t = Cofree . (id &&& fmap (anaC t) . t)

instance Functor f => Monad (Free f) where
  return = Free . Left
  m >>= k = (k ||| (inFree . fmap (>>= k))) (runFree m)

inFree :: f (Free f a) -> Free f a
inFree = Free . Right
```

Now, we can use the bizap we defined above for bifunctors to handle the (,) and Either portions and the zap function defined above to handle the nested functor, obtaining:

```haskell
instance Dual f g => Dual (Cofree f) (Free g) where
  zap op (Cofree fs) (Free as) = bizap op (zap (zap op)) fs as

instance Dual f g => Dual (Free f) (Cofree g) where
  zap op (Free fs) (Cofree as) = bizap op (zap (zap op)) fs as
```

The most trivial example of a free monad and a cofree comonad would be the 'natural number' free monad and the 'stream' comonad, which both coincidentally can be obtained from the Identity functor -- how convenient! Its almost like I planned this.

```haskell
type Nat a = Free Identity a
type Stream a = Cofree Identity a
```

We can define a successor function for our Naturals:

```haskell
suck :: Nat a -> Nat a
suck = inFree . Identity
```

And we can build up a stream of integers, just to have a stream to search through:

```haskell
ints :: Stream Int
ints = anaC (return . (+1)) 0
```

Then we can look at the *n*th element of the stream, by annihilating it with a free monad of the dual of its base functor.

In other words, we can ask for the element at a position that is given as a natural number!

```haskell
two :: Int
two = suck (suck (return id)) >$< ints
```

And by duality we can take a stream of functions, and use it to annihilate a Nat functor wrapped around a value. Another exercise for the reader.

These are of course the simplest example of a free monad and a cofree comonad, but it works for any dualizable construction.

i.e. Given a binary tree containing values you index with a path into the tree. If your tree is potentially non-infinite then your path has to be decorated with functions in order to handle potential leaves. If your path is non-infinite then your tree has to be decorated with values. The types enforce that you'll either return bottom or find a single value at some point.

Two functors enter, one value leaves.

[Source Code](http://comonad.com/haskell/posts/FreeExpression.hs)
