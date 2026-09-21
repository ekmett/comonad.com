Is `State` a `Comonad`?

Not `Costate` or rather, `Store` as we tend to call it today, but actually `State s` itself?

Let's see!

Recently there was a [post to reddit](https://www.reddit.com/r/haskell/comments/7oav51/i_made_a_monad_that_i_havent_seen_before_and_i/) in which the author `King_of_the_Homeless` suggested that he might have a `Monad` for `Store`. Moreover, it is one that is compatible with the existing `Applicative` and `ComonadApply` instances. My [knee-jerk reaction](https://www.reddit.com/r/haskell/comments/7oav51/i_made_a_monad_that_i_havent_seen_before_and_i/ds81x2a/) was to disbelieve the result, but I'm glad I stuck with playing with it over the last day or so.

In a much older post, I showed how to use the `Co` [comonad-to-monad-transformer](http://comonad.com/reader/2011/monads-from-comonads/) to convert `Store s` into `State s`, but this is a different beast, it is a monad directly on `Store s`.

```haskell
{-# language DeriveFunctor #-}

import Control.Comonad
import Data.Semigroup

data Store s a = Store
  { peek :: s -> a, pos :: s }
  deriving Functor

instance Comonad (Store s) where
  extract (Store f s) = f s
  duplicate (Store f s) = Store (Store f) s

instance
 (Semigroup s, Monoid s) =>
 Applicative (Store s) where
  pure a = Store (const a) mempty
  Store f s < *> Store g t = Store (\m -> f m (g m)) (mappend s t)

instance
 Semigroup s =>
 ComonadApply (Store s) where
  Store f s < @> Store g t = Store (\m -> f m (g m)) (s <> t)

instance
 (Semigroup s, Monoid s) =>
 Monad (Store s) where
  return = pure
  m >>= k = Store
    (\s -> peek (k (peek m s)) s)
    (pos m `mappend` pos (k (peek m mempty)))
```

My apologies for the `Semigroup` vs. `Monoid`, noise, as I'm still using GHC 8.2 locally. This will get a bit cleaner in a couple of months.

Also, `peek` here is flipped relative to the version in `Control.Comonad.Store.Class` so that I can use it directly as a field accessor.

As I noted, at first I was hesitant to believe it could work, but then I realized I'd [already implemented](https://hackage.haskell.org/package/streams-3.3/docs/Data-Stream-Infinite-Functional-Zipper.html) something like this for a special case of Store, in the 'streams' library, which got me curious. Upon reflection, this feels like the usual Store comonad is using the ability to distribute `(->) e` out or `(,) e` in using a "comonoid", which is always present in Haskell, just like how the State monad does. But the type above seems to indicate we can go the opposite direction with a monoid.

So, in the interest of exploring duality, let's see if we can build a comonad instance for \`State s\`!

Writing down the definition for state:

```haskell
newtype State s a = State
  { runState :: s -> (a, s) }
  deriving Functor

instance Applicative (State s) where
  pure a = State $ \s -> (a, s)
  State mf < *> State ma = State $ \s -> case mf s of
    (f, s') -> case ma s' of
      (a, s'') -> (f a, s'')

instance Monad (State s) where
  return = pure
  State m >>= k = State $ \s -> case m s of
    (a, s') -> runState (k a) s'
```

Given a monoid for out state, extraction is pretty obvious:

```haskell
instance
 Monoid s =>
 Comonad (State s) where
  extract m = fst $ runState m mempty
```

But the first stab we might take at how to duplicate, doesn't work.

```haskell
  duplicate m = State $ \s ->
   (State $ \t -> runState m (mappend s t)
   , s
   )
```

It passes the \`extract . duplicate = id\` law easily:

```haskell
extract (duplicate m)
= extract $ State $ \s -> (State $ \t -> runState m (mappend s t), s)
= State $ \t -> runState m (mappend s mempty)
= State $ \t -> runState m t
= State $ runState m
= m
```

But fails the second law:

```haskell
fmap extract (duplicate m)
= fmap extract $ State $ \s -> (State $ \t -> runState m (mappend s t), s)
= State $ \s -> (extract $ State $ \t -> runState m (mappend s t), s)
= State $ \s -> (fst $ runState m (mappend s mempty), s)
= State $ \s -> (evalState m s, s)
```

because it discards the changes in the state.

But the `King_of_the_Homeless`'s trick from that post (and the Store code above) can be modified to this case. All we need to do is ensure that we modify the output state 's' as if we'd performed the action unmolested by the inner monoidal state that we can't see.

```haskell
  duplicate m = State $ \s ->
    ( State $ \t -> runState m (mappend s t)
    , snd $ runState m s
    )
```

Now:

```haskell
extract (duplicate m)
= extract $ State $ \s -> (State $ \t -> runState m (mappend s t), snd $ runState m s)
= State $ \t -> runState m (mappend mempty t)
= State $ \t -> runState m t
= State $ runState m
= m
```

just like before, but the inner extraction case now works out and performs the state modification as expected:

```haskell
fmap extract (duplicate m)
= fmap extract $ State $ \s -> (State $ \t -> runState m (mappend s t), snd $ runState m s)
= State $ \s -> (extract $ State $ \t -> runState m (mappend s t), snd $ runState m s)
= State $ \s -> (fst $ runState m (mappend s mempty), snd $ runState m s)
= State $ \s -> (fst $ runState m s, snd $ runState m s)
= State $ \s -> runState m s
= State $ runState m
= m
```

This is still kind of a weird beast as it performs the state action twice with different states, but it does pass at least the left and right unit laws.

Some questions:

1\. Proving associativity is left as an exercise. It passes visual inspection and my gut feeling, but I haven't bothered to do all the plumbing to check it out. I've been wrong enough before, it'd be nice to check!

\[Edit: Simon Marechal (bartavelle) has a [coq proof](http://lpaste.net/361413) of the associativity and other axioms.\]

2\. Does this pass the `ComonadApply` laws?

```haskell
instance Monoid s => ComonadApply (State s) where
  (< @>) = (< *>)
```

\[Edit: [No](https://www.reddit.com/r/haskell/comments/7ojy6x/the_comonadreader_the_state_comonad/dsabeij/).\]

3\. The streams code above suggests at least one kind of use-case, something like merging together changes of position in a stream, analogous to the "zipping monad" you have on infinite streams. But now the positions aren't just Integers, they are arbitrary values taken from any monoid you want. What other kind of spaces might we want to "zip" in this manner?

4\. Is there an analogous construction possible for an ["update monad"](https://www.schoolofhaskell.com/user/edwardk/heap-of-successes#update-vs--state) or "coupdate comonad"? Does it require a monoid that acts on a monoid rather than arbitrary state like the [semi-direct product of monoids](https://www.youtube.com/watch?v=Txf7swrcLYs) or a ["twisted functor"](https://www.cse.iitk.ac.in/users/ppk/research/publication/Conference/2016-09-22-How-to-twist-pointers.pdf)? Is the result if it exists a twisted functor?

5\. Does \`Co\` translate from this comonad to the monad on \`Store\`?

6\. Is there a (co)monad transformer version of these?

Link: [Gist](https://gist.github.com/ekmett/1d8029a19546278adab92ebd3057f4b2)
