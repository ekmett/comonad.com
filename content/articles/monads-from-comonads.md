Today I'll show that you can derive a `Monad` from any old `Comonad` you have lying around.

But first, we'll need to take a bit of a bit of a detour.

## A Monad Sandwich

We'll need the definition of an [adjunction](http://en.wikipedia.org/wiki/Adjoint_functors) on the category of Haskell types, which we can strip down and borrow from my [adjunctions](http://hackage.haskell.org/package/adjunctions) package.

```haskell
class (Functor f, Representable u) =>
         Adjunction f u | f -> u, u -> f where
    leftAdjunct :: (f a -> b) -> a -> u b
    rightAdjunct :: (a -> u b) -> f a -> b
```

Here we can define our Adjunction by defining leftAdjunct and rightAdjunct, such that they witness an isomorphism from `(f a -> b)` to `(a -> u b)`

Every [Adjunction](http://hackage.haskell.org/packages/archive/adjunctions/1.0.0/doc/html/Data-Functor-Adjunction.html) `F -| G : C -> D`, gives rise to a monad GF on D and a Comonad FG on C.

In addition to this, you can sandwich an additional monad M on C in between GF to give a monad GMF on D:

[Control.Monad.Trans.Adjoint](http://hackage.haskell.org/packages/archive/adjunctions/1.0.0/doc/html/Control-Monad-Trans-Adjoint.html)

and you can sandwich a comonad W on D in between F and G to yield the comonad FWG on C:

[Control.Comonad.Trans.Adjoint](http://hackage.haskell.org/packages/archive/adjunctions/1.0.0/doc/html/Control-Comonad-Trans-Adjoint.html)

## A Contravariant Comonad Sandwich

As was first shown to me me by Derek Elkins, this construction works even when you C is not the category of Haskell types!

Consider the [Contravariant](http://hackage.haskell.org/packages/archive/contravariant/0.1.2/doc/html/Data-Functor-Contravariant.html) functor `Op r`:

```haskell
newtype Op a b = Op { getOp :: b -> a }

instance Contravariant (Op a) where
  contramap f g = Op (getOp g . f)
```

We can view `Op r` as a functor from `Hask^op -> Hask` or as one from `Hask -> Hask^op`.

We can define a notion of a contravariant adjunction `F -| G : Hask^op -> Hask`.

[Data.Functor.Contravariant.Adjunction](http://hackage.haskell.org/packages/archive/adjunctions/1.0.0/doc/html/Data-Functor-Contravariant-Adjunction.html)

```haskell
class (Contravariant f, Corepresentable g) =>
       Adjunction f g | f -> g, g -> f where
    leftAdjunct :: (b -> f a) -> a -> g b
    rightAdjunct :: (a -> g b) -> b -> f a
```

Where, now, `leftAdjunct` and `rightAdjunct` witness the isomorphism from `(f a < - b)` to `(a -> g b)`, which means once you flip the arrow around both seem to be going the same way. Ultimately any contravariant adjunction on Hask is comprised of two isomorphic functors, each self-adjoint.

This gives rise to one notion of a comonad-to-monad transformer!

[Control.Monad.Trans.Contravariant.Adjoint](http://hackage.haskell.org/packages/archive/adjunctions/1.0.0/doc/html/Control-Monad-Trans-Contravariant-Adjoint.html)

But we can we do better?

## An End as the Means

First, some boilerplate.

```haskell
{-# LANGUAGE Rank2Types, FlexibleInstances, FlexibleContexts, MultiParamTypeClasses, UndecidableInstances #-}

import Data.Monoid
import Control.Comonad
import Control.Applicative
import Control.Comonad.Store.Class
import Control.Comonad.Env.Class as Env
import Control.Comonad.Traced.Class as Traced
import Control.Monad.Reader.Class
import Control.Monad.Writer.Class
import Control.Monad.State.Class
import Data.Functor.Bind
```

Our new comonad to monad transformer is given by

```haskell
newtype Co w a = Co { runCo :: forall r. w (a -> r) -> r }
```

What we've done is added a quantifier to prevent the use of the type *r*, as we did when describing [`Codensity`](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.1/doc/html/Control-Monad-Codensity.html) and [`Ran`](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.1/doc/html/Data-Functor-KanExtension.html), categorically we've taken some kind of [end](http://en.wikipedia.org/wiki/End_\(category_theory\)). This idea came to me after an observation was made by Russell O'Connor that `Conts (Store s) a` was pretty close to a continuation passing style version of `State s`.

Now, we can start spitting out instances for this type.

```haskell
instance Functor w => Functor (Co w) where
   fmap f (Co w) = Co (w . fmap (. f))

instance Comonad w => Monad (Co w) where
   return a = Co (`extract` a)
   Co k >>= f = Co (k .extend (\wa a -> runCo (f a) wa))

instance Comonad w => Applicative (Co w) where
   mf < *> ma = mf >>= \f -> fmap f ma
   pure a = Co (`extract` a)
```

In my break-out of category-extras, I've split off the semigroupoid structure of Kleisli-, co-Kleisli-, and static- arrow composition as `Bind`, `Extend` and `Apply` respectively, so we can make use of slightly less structure and get slightly less structure in turn:

```haskell
instance Extend w => Bind (Co w) where
   Co k >>- f = Co (k .extend (\wa a -> runCo (f a) wa))

instance Extend w => Apply (Co w) where
   mf < .> ma = mf >>- \f -> fmap f ma
```

## From comonad-transformers to the mtl

We can look at how this transforms some particular comonads.

The comonadic version of [`State`](http://hackage.haskell.org/packages/archive/mtl/2.0.1.0/doc/html/Control-Monad-State-Lazy.html) is [`Store`](http://hackage.haskell.org/packages/archive/comonad-transformers/1.7/doc/html/Control-Comonad-Trans-Store-Lazy.html). Looking at `Co (Store s) a`

```haskell
Co (Store s) a ~ forall r. ((s -> a -> r, s) -> r)
         ~ forall r. (s -> a -> r) -> s -> r
         ~ forall r. (a -> s -> r) -> s -> r
         ~ Codensity ((->)s) a
         ~ State s a
```

This gives rise to a leap of intuition that we'll motivate further below:

```haskell
instance ComonadStore s m => MonadState s (Co m) where
   get = Co (\w -> extract w (pos w))
   put s = Co (\w -> peek s w ())
```

Sadly this breaks down a little for `Writer` and `Reader` as the `mtl` unfortunately has historically included a bunch of extra baggage in these classes. In particular, in reader, the notion of `local` isn't always available, blocking some otherwise perfectly good `MonadReader` instances, and I've chosen not to repeat this mistake in `comonad-transformers`.

```haskell
instance ComonadEnv e m => MonadReader e (Co m) where
   ask = Co (\w -> extract w (Env.ask w))
   local = error "local"
```

Ideally, local belongs in a subclass of `MonadReader`.

```haskell
class Monad m => MonadReader e m | m -> e where
   ask :: m a -> e

class MonadReader e m => MonadLocal e m | m -> e where
   local :: (e -> e) -> m a -> m a
```

Similarly there is a lot of baggage in the `MonadWriter`. The `Monoid` constraint isnt necessary for the class itself, just for most instances, and the `listen` and `pass` members should be a member of a more restricted subclass as well to admit some missing `MonadWriter` instances, but we can at least provide the notion of tell that is critical to `Writer`.

```haskell
instance (Monoid e, ComonadTraced e m) => MonadWriter e (Co m) where
   tell m = Co (\w -> Traced.trace m w ())
   listen = error "listen"
   pass = error "pass"
```

But given the split out

```haskell
instance Monad m => MonadWriter e m | m -> e where
    tell :: e -> m ()

instance MonadWriter e m => MonadListen e m | m -> e
    listen :: m a -> m (a, w)
    pass :: m (a, w -> w) -> m a
```

We could provide this functionality more robustly. (There is a similar subset of `Comonad`s that can provide listen and pass analogues.)

While I am now the maintainer of the mtl, I can't really justify making the above corrections to the class hierarchy at this time. They would theoretically break a lot of code. I would be curious to see how much code would break in practice though.

## Combinators Please!

There is a recurring pattern in the above code, so we can also improve this construction by providing some automatic lifting combinators that take certain cokleisli arrows and give us monadic values

```haskell
lift0 :: Comonad w => (forall a. w a -> s) -> Co w s
lift0 f = Co (extract < *> f)

lift1 :: (forall a. w a -> a) -> Co w ()
lift1 f = Co (`f` ())
```

along with their inverses

```haskell
lower0 :: Functor w => Co w s -> w a -> s
lower0 (Co f) w = f (id < $ w)

lower1 :: Functor w => Co w () -> w a -> a
lower1 (Co f) w = f (fmap const w)
```

(The proofs that these are inverses are quite hairy, and lean heavily on parametricity.)

Then in the above, the code simplifies to:

```haskell
get = lift0 pos
put s = lift1 (peek s)
ask = lift0 Env.ask
tell s = lift1 (tell s)
```

## Co-Density?

Co and Codensity are closely related.

Given any Comonad W, it is given rise to by the composition FG for some adjunction `F -| G : Hask -> C`.

Considering only the case where `C = Hask` for now, we can find that

```haskell
Co w a ~ forall r. (f (g (a -> r)) -> r).
```

Since `f -| g`, we know that `g` is `Representable` by `f ()`, as witnessed by:

```haskell
tabulateAdjunction :: Adjunction f u => (f () -> b) -> u b
tabulateAdjunction f = leftAdjunct f ()

indexAdjunction :: Adjunction f u => u b -> f a -> b
indexAdjunction = rightAdjunct . const
```

therefore

```haskell
Co w a ~ f (g (a -> r)) -> r ~ f (f () -> a -> r) -> r
```

Since *f* is a left adjoint functor, `f a ~ (a, f ())` by Sjoerd Visscher's elegant little `split` combinator:

```haskell
split :: Adjunction f u => f a -> (a, f ())
split = rightAdjunct (flip leftAdjunct () . (,))
```

which has the simple inverse

```haskell
unsplit :: Adjunction f g => a -> f () -> f a
unsplit a = fmap (const a)
```

so we can apply that to our argument:

```haskell
Co w a ~ forall r. f (f () -> a -> r) -> r ~
   forall r. (f () -> a -> r, f ()) -> r
```

and curry to obtain

```haskell
Co w a ~ forall r. (f () -> a -> r) -> f () -> r
```

and swap the arguments

```haskell
Co w a ~ forall r. (a -> f () -> r) -> f () -> r
```

then we can tabulate the two subtypes of the form (f () -> r)

```haskell
Co w a ~ forall r. (a -> g r) -> g r
```

and so we find that

```haskell
Co w a ~ Codensity g a
```

Finally,

```haskell
Codensity g a ~ Ran g g a
```

but we showed back in my second article on Kan extensions that given f -| g that

```haskell
Ran g g a ~ g (f a)
```

So `Co w ~ Co (f . g) ~ (g . f)`, the monad given rise to by composing our adjunction the other way!

## Comonads from Monads?

Now, given all this you might ask

> Is there is a similar construction that lets you build a comonad out of a monad?

Sadly, it seems the answer **in Haskell** is no.

Any adjunction from `Hask -> Hask^op` would require two functions

```haskell
class (Contravariant f, Contravariant g) => DualContravariantAdjunction f g where
    leftAdjunct :: (f a -> b) -> g b -> a
    rightAdjunct :: (g b -> a) -> f a -> b
```

where **both functors are contravariant**.

Surmounting the intuitionistic impossibility of this, then given any such adjunction, there would be a nice coend we could take, letting us sandwich any `Monad` in the middle as we did above.

There does exist one such very boring Contravariant Functor.

```haskell
newtype Absurd a = Absurd (Absurd a)

absurdity :: Absurd a -> b
absurdity (Absurd a) = absurdity a

instance Contravariant Absurd where
   contramap f (Absurd as) = Absurd (contramap f as)

instance DualContravariantAdjunction Absurd Absurd where
    leftAdjunct _ = absurdity
    rightAdjunct _ = absurdity
```

We can safely sandwich IO within this adjunction from `Hask -> Hask^op` to obtain a comonad.

```haskell
newtype Silly m a = Silly { runSilly :: Absurd (m (Absurd a)) }

instance Monad m => Extend (Silly m) where
    extend f (Silly m) = absurdity m

instance Monad m => Comonad (Silly m) where
    extract (Silly m) = absurdity m
```

But for any more interesting such type that actually lets us get at its contents, we would be able to derive a circuitous path to `unsafePerformIO`!

Since `unsafePerformIO` should not be constructible without knowing `IO` specifics, no **useful** `DualContravariantAdjunction`s should exist.
