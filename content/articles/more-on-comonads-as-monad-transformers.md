Last time in [Monad Transformers from Comonads](http://comonad.com/reader/2011/monad-transformers-from-comonads/) I showed that given any comonad we can derive the monad-transformer

```haskell
newtype CoT w m a = CoT { runCoT :: w (a -> m r) -> m r
```

and so demonstrated that there are fewer comonads than monads in Haskell, because while every Comonad gives rise to a Monad transformer, there are Monads that do not like `IO`, `ST s`, and `STM`.

I want to elaborate a bit more on this topic.

In [Monads from Comonads](http://comonad.com/reader/2011/monads-from-comonads/) we observed that for non-transformer version of `CoT`

```haskell
type Co w = CoT w Identity
```

under the assumption that `w = f . g` for `f -| g : Hask -> Hask`, then

```haskell
Co w ~ Co (f . g) ~ g . f
```

This demonstrated that the `Co w` is isomorphic to the monad we obtain by composing the adjunction that gave rise to our comonad the other way around.

But what about `CoT`?

Sadly `CoT` is a bit bigger.

We can see by first starting to apply the same treatment that we gave `Co`.

```haskell
CoT w m a ~ forall r. w (a -> m r) -> m r
    ~ forall r. f (g (a -> m r)) -> m r
    ~ forall r. f (f() -> a -> m r) -> m r
    ~ forall r. f (a -> f () -> m r) -> m r
    ~ forall r. (a -> f () -> m r, f ()) -> m r
    ~ forall r. (a -> f () -> m r) -> f () -> m r
    ~ forall r. (a -> g (m r)) -> g (m r)
    ~ Codensity (g . m) a
```

(I'm using `.` to represent `Compose` for readability.)

But we've seen before that `Codensity g a` is in a sense bigger than `g a`, since given an Adjunction `f -| g`, `Codensity g a ~ (g . f) a`, **not** `g a`.

Moreover can compose adjunctions:

```haskell
instance
    (Adjunction f g, Adjunction f' g') =>
    Adjunction (Compose f' f) (Compose g g') where
  unit   = Compose . leftAdjunct (leftAdjunct Compose)
  counit = rightAdjunct (rightAdjunct getCompose) . getCompose
```

So if `n -| m`, then we can see that `Codensity (g . m) a ~ g . m . n . f`, rather than the smaller `g . m . f`, which we can obtain using `AdjointT f g m` from [Control.Monad.Trans.Adjoint](http://hackage.haskell.org/packages/archive/adjunctions/1.8.0/doc/html/Control-Monad-Trans-Adjoint.html) in [adjunctions](http://hackage.haskell.org/package/adjunctions).

So `CoT` isn't the smallest monad transformer that would be given by an adjunction.

In fact, it is isomorphic to `AdjointT f g (Codensity m) a` instead of `AdjointT f g m a`.

Sadly, there doesn't appear to be a general purpose construction of the smaller transformer just given an unseparated `w = f . g`.
