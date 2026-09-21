In the last few posts, I've been talking about how we can derive [monads](http://comonad.com/reader/2011/monads-from-comonads/) and [monad transformers](http://comonad.com/reader/2011/monad-transformers-from-comonads/) from comonads. Along the way we learned that there are more monads than comonads in Haskell.

The question I hope to answer this time, is whether or not we turn any Haskell `Comonad` into a [comonad transformer](http://hackage.haskell.org/packages/archive/comonad-transformers/1.8.0/doc/html/Control-Comonad-Trans-Class.html).

## Comonads from Comonads

In [Monads from Comonads](http://comonad.com/reader/2011/monads-from-comonads/), we built the comonad-to-monad transformer

```haskell
newtype Co w m a = Co (forall r. w (a -> r) -> r)
```

by sandwiching a `Comonad` *w* in the middle of a trivial Codensity monad, then proceeded to show that at least in the case where our comonad was given rise to by an adjunction `f -| g : Hask -> Hask`, we could reason about this as if we had

```haskell
Co w ~ Co (f . g) ~ g . f
```

Now, `Codensity` monads are a right [Kan extension](http://en.wikipedia.org/wiki/Kan_extension).

So, what happens if we try to do the same thing to a Left Kan extension?

Using

```haskell
{-# LANGUAGE GADTs, FlexibleInstances #-}

import Control.Comonad
import Control.Comonad.Trans.Class
```

we can define

```haskell
data L w a where
  L :: w (r -> a) -> r -> L w a
```

and a number of instances pop out for free, cribbed largely from the definition for Density.

```haskell
instance Functor w => Functor (L w) where
  fmap f (L w r) = L (fmap (f .) w) r

instance ComonadTrans L where
  lower (L w r) = fmap ($r) w

instance Extend w => Extend (L w) where
  duplicate (L w s) = L (extend L w) s

instance Comonad w => Comonad (L w) where
  extract (L w r) = extract w r
```

Reasoning as before about `w` as if it were composed of an adjunction `f -| g : Hask -> Hask` to build some intuition, we can see:

```haskell
L w a ~ exists r. (w (r -> a), r)
      ~ exists r. (f (g (r -> a)), r)
      ~ exists r. (f (), g (r -> a), r)
      ~ exists r. (f (), f () -> r -> a, r)
      ~ exists r. (f () -> r -> a, f r)
      ~ exists r. (f r -> a, f r)
      ~ Density f a
      ~ Lan f f a
      ~ (f . Lan f Id) a
      ~ (f . g) a
      ~ w a
```

The latter few steps require identities established in my [second post on Kan extensions](http://comonad.com/reader/2008/kan-extensions-ii/).

With that we obtain the "remarkable" insight that `L ~ IdentityT`, which I suppose is much more obvious when just looking at the type

```haskell
data L w a where
  L :: w (r -> a) -> r -> L w a
```

and seeing the existentially quantified `r` as a piece of the environment, being used to build an `a`, since there is nothing else we can do with it, except pass it in to each function wrapped by `w`! So at first blush, we've gained nothing.

The key observation is that in one case we would up with something isomorphic to the codensity monad of our right adjoint, while in the other case we would up with the density comonad of our left adjoint. The former is isomorphic to the monad given by our adjunction, while the latter is isomorphic to the comonad, which is, unfortunately, right where we started!

## In The Future All Comonads are Comonad Transformers!

Of course, we don't have to just modify a trivial left Kan extension. Let's tweak the `Density` comonad of another comonad!

```haskell
data D f w a where
  D :: w (f r -> a) -> f r -> D f w a
```

Since both arguments will be comonads, and I want this to be a comonad transformer, I'm going to swap the roles of the arguments relative to the definition of `CoT w m`. The reason is that `D f w` is a Comonad, regardless of the properties of f, so long as `w` is a `Comonad` This is similar to how `Density f` is a Comonad regardless of what `f` is, as long as it has kind `* -> *`.

The implementation of `D` is identical to `L` above, just as `CoT` and `Co` share implementations and `ContT` and `Cont` do.

```haskell
instance Functor w => Functor (D f w) where
  fmap f (D w r) = D (fmap (f .) w) r

instance Extend w => Extend (D f w) where
  duplicate (D w s) = D (extend D w) s

instance Comonad w => Comonad (D f w) where
  extract (D w r) = extract w r

instance ComonadTrans (D f) where
  lower (D w r) = fmap ($r) w
```

But in addition to being able to `lower :: D f w a -> w a`, we can also lower to the other comonad!

```haskell
fstD :: (Extend f, Comonad w) => D f w a -> f a
fstD (D w r) = extend (extract w) r

sndD :: Comonad w => D f w a -> w a
sndD = lower
```

This means that if either comonad provides us with a piece of functionality we can exploit it.

## Selling Products

In general Monad products always exist:

```haskell
newtype Product m n a = Pair { runFst :: m a, runSnd :: n a }

instance (Monad m, Monad n) => Monad (Product m n) where
   return a = Pair (return a) (return a)
   Pair ma na >>= f = Pair (ma >>= runFst . f) (na >>= runSnd . f)
```

and Comonad coproducts always exist:

```haskell
newtype Coproduct f g a = Coproduct { getCoproduct :: Either (f a) (g a) }

left :: f a -> Coproduct f g a
left = Coproduct . Left

right :: g a -> Coproduct f g a
right = Coproduct . Right

coproduct :: (f a -> b) -> (g a -> b) -> Coproduct f g a -> b
coproduct f g = either f g . getCoproduct

instance (Extend f, Extend g) => Extend (Coproduct f g) where
  extend f = Coproduct . coproduct
    (Left . extend (f . Coproduct . Left))
    (Right . extend (f . Coproduct . Right))

instance (Comonad f, Comonad g) => Comonad (Coproduct f g) where
  extract = coproduct extract extract
```

but Christoph Lüth and Neil Ghani showed that [monad coproducts don't always exist](http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.8.3581)!

On the other hand what we built up above looks a lot like a comonad product!

Too see that, first we'll note some of the product-like things we can do:

`fstD` and `sndD` act a lot like `fst` and `snd`, projecting our parts of our product and it turns out we can "braid" our almost-products, interchanging the left and right hand side.

```haskell
braid :: (Extend f, Comonad w) => D f w a -> D w f a
braid (D w r) = D (extend (flip extract) r) w
```

(I use scary air-quotes around braid, because it doesn't let us braid them in a categorical sense, as we'll see.)

After braiding, one of our projections swaps places as we'd expect:

```haskell
sndD (braid (D w r)) = -- by braid def
sndD (D (extend (flip extract) r) w) = -- by sndD (and lower) def
fmap ($w) (extend (flip extract) r) = -- extend fmap fusion
extend (($w) . flip extract) r = -- @unpl
extend (\t -> flip extract t w) r = -- flip . flip = id
extend (extract w) r = -- by fstD def
fstD (D w r)
```

But we stall when we try to show `fstD . braid = sndD`.

Why is that?

## A Product of an Imperfect Union

[Last time](http://comonad.com/reader/2011/more-on-comonads-as-monad-transformers/), when we inspected `CoT w m a` we demonstrated that on one hand given a suitable adjunction `f -| g`, such that `w = f . g`, `Co w ~ Co (f . g) ~ (g . f)`, but on the other `CoT w m a` was bigger than `g . m . f`, and that if n -| m, then `CoT w m a ~ g . m . n . f`.

Of course, these two results agree, if you view `Co w` as `CoT w Identity`, where `Identity -| Identity`, since `Identity ~ Identity . Identity`

Therefore it should come as no surprise that given `w = f . g`, for a suitable adjunction `f -| g`, then `D w j a` is bigger than `f . j . g`. In fact if, `j -| k`, then `D w j ~ f . j . k . g`.

So what is happening is that we have only managed to "break one of our comonads in half", and `D w j a` lets you do 'too much stuff' with the `j` portion of the comonad. This keeps us from being symmetric.

Moreover it turns out to be a bit trickier to build one than to just hand in a `w (f a)` or `w a` and an `f a` to build our product-like construction.

Even so, exploiting Density *was* enough to transform any comonad into a comonad-transformer and to enable us to access the properties of either the comonad we are transforming with, or the comonad that we are transforming.
