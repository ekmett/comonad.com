Andrej Bauer recently gave a really nice talk on how you can exploit side-effects to make a faster version of Martin Escardo's pseudo-paradoxical combinators.

[A video of his talk is available over on his blog](http://math.andrej.com/2011/12/06/how-to-make-the-impossible-functionals-run-even-faster/), and his presentation is remarkably clear, and would serve as a good preamble to the code I'm going to present below.

Andrej gave a related invited talk back at [MSFP 2008](http://msfp.org.uk/) in Iceland, and afterwards over lunch I cornered him (with Dan Piponi) and explained how you could use parametricity to close over the side-effects of monads (or arrows, etc) but I think that trick was lost in the chaos of the weekend, so I've chosen to resurrect it here, and improve it to handle some of his more recent performance enhancements, and show that you don't need side-effects to speed up the search after all!

First, we'll need to import a few things:

```haskell
{-# LANGUAGE RankNTypes #-}

import Data.Maybe (fromMaybe)
import Control.Applicative
import Data.IntMap (IntMap)
import qualified Data.IntMap as IntMap
import Control.Monad
import Control.Monad.Trans.Class
import Data.Functor.Identity
```

What are looking for is an implementation of [Hilbert's epsilon](http://en.wikipedia.org/wiki/Epsilon_calculus).

This is a formal mechanism for eliminating existentials over some non-empty set **X** by defining a function

```haskell
ε: (X -> Prop) -> X
```

such that if there exists an *x* in **X** such that *p*(**X**) holds then *p*(*ε*(*p*)) holds.

As noted by Andrej, we could reify this constructively as a function "epsilon :: (X -> Bool) -> X" for some X.

Now, for some sets, Hilbert's epsilon is really easy to define. If X is a finite set, you can just exhaustively enumerate all of the options returning a member of X such that the property holds if any of them do, otherwise since X is non-empty, just return one of the elements that you tested.

This would be a pretty boring article and I'd be back to eating Christmas dinner with my family if that was all there was to it. However, certain infinite spaces can also be searched.

Last year, Luke Palmer wrote a post on ["Searchable Data Types"](http://lukepalmer.wordpress.com/2010/11/17/searchable-data-types/) that might also serve as a good introduction. In that article he led off with the easiest infinite space to search, the lazy naturals, or the 'one point compactification of the naturals'. That is to say the natural numbers extended with infinity.

```haskell
data LazyNat = Zero | Succ LazyNat
infinity :: LazyNat
infinity = Succ infinity
```

Now we can implement Palmer's epsilon (called `lyingSearch` in his article).

```haskell
palmer :: (LazyNat -> Bool) -> LazyNat
palmer p
  | p Zero = Zero
  | otherwise = Succ $ palmer $ p . Succ
```

The trick to making this work is that we place a requirement that the predicate that you pass has to terminate in a bounded amount of time no matter what input you give it, and since we're working with the naturals extended with `infinity`, if no natural satisfies the predicate, we'll just keep returning a longer and longer chain of `Succ`'s, effectively yielding `infinity`.

To check to see if the returned number satisfies the predicate you can always use `p (palmer p)`. The predicate is required to terminate in finite time, even when given infinity, so this will yield a Bool and not bottom out unless the user supplied predicate takes an unbounded amount of time.

I posted a reply to Luke's article when it came up on reddit which included a Hinze-style generic implementation of his `lyingSearch` predicate, which you can see now is just Hilbert's epsilon for arbitrary recursive polynomial data types.

[http://www.reddit.com/r/haskell/comments/e7nij/searchable\_data\_types/c15zs6l](http://www.reddit.com/r/haskell/comments/e7nij/searchable_data_types/c15zs6l)

Another space we can search is [the Cantor space](http://en.wikipedia.org/wiki/Cantor_space) 2^N.

```haskell
type Cantor = Integer -> Bool
```

With that we jump clear from countable infinity to uncountable infinity, but it can still be searched in finite time!

This is the space we'll be paying attention to for the rest of this article.

First we'll define how to "[book a room in Hilbert's Hotel](http://en.wikipedia.org/wiki/Hilbert's_paradox_of_the_Grand_Hotel)."

```haskell
infixr 0 #
(#) :: Bool -> Cantor -> Cantor
(x # a) 0 = x
(x # a) i = a (i - 1)
```

Then this can be used to obtain the following implementation of Hilbert's epsilon for the Cantor space, attributed by Andrej to Ulrich Berger.

```haskell
berger :: (Cantor -> Bool) -> Cantor
berger p =
  if ex $ \a -> p $ False # a
  then False # berger $ \a -> p $ False # a
  else True  # berger $ \a -> p $ True # a
  where ex q = q (berger q)
```

This version is particularly close in structure to the one for searching the LazyNats, but it is dreadfully slow!

It would be nice to be able to search the space faster and that is just what Martin Escardo's improved version does, through a more sophisticated divide and conquer technique.

```haskell
escardo :: (Cantor -> Bool) -> Cantor
escardo p = go x l r where
  go x l r n =  case divMod n 2 of
    (0, 0) -> x
    (q, 1) -> l q
    (q, 0) -> r $ q-1
  x = ex $ \l -> ex $ \r -> p $ go True l r
  l = escardo $ \l -> ex $ \r -> p $ go x l r
  r = escardo $ \r -> p $ go x l r
  ex q = q (escardo q)
```

To proceed from here I'll need a State monad:

```haskell
newtype S s a = S { runS :: s -> (a, s) }

instance Functor (S s) where
  fmap f (S m) = S $ \s -> case m s of
    (a, s') -> (f a, s')

instance Applicative (S s) where
  pure = return
  (< *>) = ap

instance Monad (S m) where
  return a = S $ \s -> (a, s)
  S m >>= k = S $ \s -> case m s of
    (a, s') -> runS (k a) s'
```

And now we've reached the point. From here, Andrej's pure code ends, and his side-effecting ocaml and custom programming language start. The first thing he does is compute the modulus of continuity by using a side-effect that writes to a reference cell which he very carefully ensures doesn't leak out of scope, so he doesn't have to concern himself with the proposition code editing the value of the reference.

```ocaml
let mu f a =
  let r = ref 0 in
  let b n = (r := max n ! r; a n) in
    ignore (f b);
    !r
```

To obtain the same effect we'll instead make a predicate using the state monad to model the single reference cell.

```haskell
-- bad
modulus :: (Num b, Ord s) =>
  ((s -> S s a) -> S b c) -> (s -> a) -> b
```

We can mash b and s together, and try to make the ordering and number agree by claiming that it is instead Real and we'd get the slightly more reasonable looking type:

```haskell
-- still bad
modulus :: Real a =>
  ((a -> S n b) -> S n c) -> (a -> b) -> a
```

In the imperative code, lexical scoping had ensured that no other code could edit the reference cell, but with this type we don't have that. The predicate is allowed to use arbitrary state actions to muck with the modulus of convergence even though the only thing that should be editing it is the wrapper beta that we placed around alpha.

But how can we ensure that the end user couldn't gain access to any of the additional functionality from the monad? Parametricity!

```haskell
-- getting better
modulus :: Real a =>
  (forall f. Monad f => (a -> f b) -> f c) ->
  (a -> b) ->
  a
```

Here the only thing you are allowed to assume about f is that it forms a monad. This gives you access to return and >>=, but the predicate can't do anything interesting with them. All it can do is work with what is effectively the identity monad, since it knows no additional properties!

We can have mercy on the end user and give them a little bit more syntactic sugar, since it doesn't cost us anything to let them also have access to the Applicative instance.

```haskell
-- good
modulus :: Real a =>
  (forall f. (Monad f, Applicative f) => (a -> f b) -> f c) ->
  (a -> b) ->
  a
```

With that we can show Andrej's version of the modulus of convergence calculation does not need side-effects!

```haskell
modulus (\a -> a 10 >>= a) (\n -> n * n)
100
```

Admittedly plumbing around the monadic values in our proposition is a bit inconvenient.

His next example was written in a custom ocaml-like programming language. For translating his effect type into Haskell using parametricity, we'll need a CPS'd state monad, so we can retry from the current continuation while we track a map of assigned values.

```haskell
newtype K r s a = K { runK :: (a -> s -> r) -> s -> r }

instance Functor (K r s) where
  fmap = liftM

instance Applicative (K r s) where
  pure = return
  (< *>) = ap

instance Monad (K r s) where
  return a = K $ \k -> k a
  K m >>= f = K $ \k -> m $ \a -> runK (f a) k
```

For those of you who have been paying attention to my previous posts, `K r s` is just a `Codensity` monad!

```haskell
neighborhood ::
  (forall f. (Applicative f, Monad f) => (Int -> f Bool) -> f Bool) ->
  IntMap Bool
neighborhood phi = snd $ runK (phi beta) (,) IntMap.empty where
  beta n = K $ \k s -> case IntMap.lookup n s of
    Just b -> k b s
    Nothing -> case k True (IntMap.insert n True s) of
      (False, _) -> k False (IntMap.insert n False s)
      r -> r
```

With that we can adapt the final version of Hilbert's epsilon for the Cantor space that Andrej provided to run in pure Haskell.

```haskell
bauer ::
  (forall f. (Applicative f, Monad f) => (Int -> f Bool) -> f Bool) ->
  Cantor
bauer p = \n -> fromMaybe True $ IntMap.lookup n m where
  m = neighborhood p
```

With a little work you can implement a version of an exists and forAll predicate on top of that by running them through the identity monad.

```haskell
exists ::
  (forall f. (Applicative f, Monad f) => (Int -> f Bool) -> f Bool) ->
  Bool
forAll ::
  (forall f. (Applicative f, Monad f) => (Int -> f Bool) -> f Bool) ->
  Bool
```

I've gone further in playing with this idea, using monad homomorphisms rather than simply relying on the canonical homomorphism from the identity monad. You can get the gist of it here:

[https://gist.github.com/1518767](https://gist.github.com/1518767)

This permits the predicates themselves to embed some limited monadic side-effects, but then you get more extensional vs. intensional issues.

An obvious direction from here is to fiddle with a version of Martin Escardo's search monad that takes advantage of these techniques, but I'll leave the exploration of these ideas to the reader for now and go enjoy Christmas dinner.

Happy Holidays,  
Edward Kmett
