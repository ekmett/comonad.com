A couple of years back [Janis Voigtländer](http://www.iai.uni-bonn.de/~jv/) wrote [a nice paper](http://www.iai.uni-bonn.de/~jv/mpc08.pdf) on how one can use the codensity monad to improve the asymptotic complexity of algorithms using the free monads. He didn't use the name [Codensity](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/Control-Monad-Codensity.html) in the paper, but this is essentially the meaning of his type `C`.

I just returned from [running a workshop on domain-specific languages at McMaster University](http://www.cas.mcmaster.ca/~anand/DSL2011.html) with the more than able assistance of [Wren Ng Thornton](http://llama.freegeek.org/~wren/thornton_cv.pdf). Among the many topics covered, I spent a lot of time talking about how to use free monads to build up term languages for various DSLs with simple evaluators, and then made them efficient by using `Codensity`.

This has been shown to be a sufficient tool for this task, but is it necessary?

First, some context:

## Monads for Free

Given that *f* is a `Functor`, we get that

```haskell
data Free f a = Pure a | Free (f (Free f a))
```

is a `Monad` for free:

```haskell
instance Functor f => Functor (Free f) where
   fmap f (Pure a) = Pure (f a)
   fmap f (Free as) = Free (fmap (fmap f) as)

instance Functor f => Monad (Free f) where
   return = Pure
   Pure a >>= f = f a -- the first monad law!
   Free as >>= f = Free (fmap (>>= f) as)
```

The definition is also free in a particular categorical sense, that if *f* is a monad, then, and you have a forgetful functor that forgets that it is a monad and just yields the functor, then the the free construction above is left adjoint to it.

This type and much of the code below is actually provided by [Control.Monad.Trans.Free](http://hackage.haskell.org/packages/archive/comonad-transformers/1.7/doc/html/Control-Monad-Trans-Free.html) in the [comonad-transformers](http://hackage.haskell.org/package/comonad-transformers) package on hackage.

For a while, Free lived in a separate, now defunct, package named `free` with its dual [Cofree](http://hackage.haskell.org/packages/archive/comonad-transformers/1.7/doc/html/Control-Comonad-Trans-Cofree.html), but it was merged into comonad-transformers due to complications involving [comonads-fd](http://hackage.haskell.org/package/comonads-fd), the comonadic equivalent of the mtl. Arguably, a better home would be transformers, to keep symmetry.

## Free is a Monad Transformer

```haskell
instance MonadTrans Free where
    lift = Free . liftM Pure
```

and there exists a [retraction](http://en.wikipedia.org/wiki/Retract_\(category_theory\)) for lift

```haskell
retract :: Monad f => Free f a -> f a
retract (Pure a) = return a
retract (Free as) = as >>= retract
```

such that `retract . lift = id`. I've [spoken about this on Stack Overflow](http://stackoverflow.com/questions/6221531/how-to-convert-a-free-monad-into-a-functor/6231795#6231795), including the rather trivial proof, previously.

This lets us work in `Free m a`, then flatten back down to a single layer of *m*.

This digression will be useful in a subsequent post.

## MonadFree

What Janis encapsulated in his paper is the notion that we can abstract out the extra power granted by a free monad to add layers of *f* to some monad *m*, and then use a better representation to improve the asymptotic performance of the monad.

The names below have been changed slightly from his presentation.

```haskell
class (Monad m, Functor f) => MonadFree f m | m -> f where
    wrap :: f (m a) -> m a

instance Functor f => MonadFree f (Free f) where
    wrap = Free
```

instances can easily be supplied to lift `MonadFree` over the common monad transformers. For instance:

```haskell
instance (Functor f, MonadFree f m) => MonadFree f (ReaderT e m) where
    wrap fs = ReaderT $ \e -> wrap $ fmap (`runReaderT` e) fs
```

This functionality is provided by [Control.Monad.Free.Class](http://hackage.haskell.org/packages/archive/comonads-fd/1.7/doc/html/Control-Monad-Free-Class.html).

Janis then proceeded to define the aforementioned type `C`, which is effectively identical to

```haskell
newtype Codensity f a = Codensity (forall r. (a -> f r) -> f r)
```

This type is supplied by [Control.Monad.Codensity](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/Control-Monad-Codensity.html) from my [kan-extensions](http://hackage.haskell.org/package/kan-extensions) package on hackage.

I have spoken about this type (and another that will arise in a subsequent post) on this blog previously, in a series of posts on Kan Extensions. \[ [1](http://comonad.com/reader/2008/kan-extensions/), [2](http://comonad.com/reader/2008/kan-extensions-ii/), [3](http://comonad.com/reader/2008/kan-extension-iii/)\]

`Codensity f` is a `Monad`, **regardless** of what *f* is!

In fact, you can quite literally cut and paste much of the definitions for `return`, `fmap`, and `(>>=)` from the code for the `ContT` monad transformer! Compare

```haskell
instance Functor (Codensity k) where
  fmap f (Codensity m) = Codensity (\k -> m (k . f))

instance Monad (Codensity f) where
  return x = Codensity (\k -> k x)
  m >>= k = Codensity (\c -> runCodensity m (\a -> runCodensity (k a) c))

instance MonadTrans Codensity where
   lift m = Codensity (m >>=)
```

from [Control.Monad.Codensity](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/src/Control-Monad-Codensity.html) in [kan-extensions](http://hackage.haskell.org/package/kan-extensions) with

```haskell
instance Functor (ContT r m) where
    fmap f m = ContT $ \c -> runContT m (c . f)

instance Monad (ContT r m) where
    return a = ContT ($ a)
    m >>= k  = ContT $ \c -> runContT m (\a -> runContT (k a) c)

instance MonadTrans (ContT r) where
    lift m = ContT (m >>=)
```

from the [Control.Monad.Trans.Cont](http://hackage.haskell.org/packages/archive/transformers/0.2.2.0/doc/html/src/Control-Monad-Trans-Cont.html) in [transformers](http://hackage.haskell.org/package/transformers-0.2.2.0).

`Codensity m a` is effectively `forall r. ContT r m a`. This turns out to be just enough of a restriction to rule out the use of [callCC](http://hackage.haskell.org/packages/archive/transformers/0.2.2.0/doc/html/Control-Monad-Trans-Cont.html#v:callCC), while leaving the very powerful fact that when you lower them back down using

```haskell
lowerCodensity :: Monad m => Codensity m a -> m a
lowerCodensity (Codensity m) = m return
```

or

```haskell
runContT :: ContT r m a -> m r
runContT (ContT m) = m return
```

`ContT` and `Codensity` both yield a result in which all of the uses of the underlying monad's `(>>=)` are right associated.

This can be convenient for two reasons:

First, some almost-monads are not associative, and converting to ContT or Codensity can be used to fix this fact.

Second, in many monads, when you build a big structure using left associated binds, like:

```haskell
    (f >>= g) >>= h
```

rather than use right associated binds like

```haskell
   f >>= \x -> g x >>= h
```

then you wind up building a structure, then tearing it down and building up a whole new structure. This can compromise the productivity of the result, and it can also affect the asymptotic performance of your code.

Even though the monad laws say these two yield the same answer.

## The dual of substitution is redecoration

To see that, first, it is worth noting that about ten years back, Tarmo Uustalu and Varmo Vene wrote "[The dual of substitition is redecoration](http://www.ioc.ee/~tarmo/papers/sfp01-book.pdf)", which among other things quite eloquently described how monads are effectively about substituting new tree-like structures, and then renormalizing.

This can be seen in terms of the more categorical viewpoint, where we define a monad in terms of `return`, `fmap` and `join`, rather than `return` and `(>>=)`. In that presentation:

```haskell
m >>= f = join (fmap f m)
```

`fmap` is performing substitution. and `join` is dealing with any renormalization.

Done this way, `(m >>= f)` on the `Maybe` monad would first `fmap` to obtain `Just (Just a)`, `Just Nothing` or `Nothing` before flattening.

In the Maybe a case, the association of your binds is largely immaterial, the normalization pass fixes things up to basically the same size, but in the special case of a free monad the monad is **purely defined in terms of substitution**, since:

```haskell
-- join :: Functor f => Free f (Free f a) -> Free f a
-- join (Pure a) = a
-- join (Free as) = Free (fmap join as)
```

This means that every time you `>>=` a free monad you are accumulating structure -- structure that you have traverse past to deal with subsequent left-associated invocations of `>>=`! Free monads never shrink after a bind and the main body of the tree never changes.

More concretely, you could build a binary tree with

```haskell
-- data Tree a = Tip a | Bin (Tree a) (Tree a)
```

and make a monad out of it, writing out your `return` and `(>>=)`, etc. by hand

The same monad could be had 'for free' by taking the free monad of

```haskell
data Bin a = Bin a a
    deriving (Functor, Foldable, Traversable)
    -- using LANGUAGE DeriveFunctor, DeriveFoldable, DeriveTraversable
```

yielding the admittedly slightly less convenient type signature

```haskell
type Tree = Free Bin
```

Now you can use `return` for `Tip`, and

```haskell
bin :: MonadFree Bin m => m a -> m a -> m a
bin l r = wrap (Bin l r)
```

to construct a binary tree node, using any free monad representation.

Now, if that representation is `Free Bin` (or the original more direct `Tree` type above) then code that looks like `f >>= \x -> g x >>= h` performs fine, but `(f >>= g) >>= h` will retraverse the unchanging 'trunk' of the tree structure twice. That isn't so bad, but given n uses of >>= we'll traverse an ever-growing trunk over and over *n* times!

## Putting Codensity to Work

But, we have a tool that can fix this, `Codensity`!

```haskell
instance MonadFree f m => MonadFree f (Codensity m) where
  wrap t = Codensity (\h -> wrap (fmap (\p -> runCodensity p h) t))
```

Janis packaged up the use of `Codensity` into a nice combinator that you can sprinkle through your code, so that your users never need know it exists. Moreover, it prevents them from accidentally using any of the extra power of the intermediate representation. If your code typechecks before you use improve somewhere within it, and it type checks after, then it will yield the same answer.

```haskell
improve :: Functor f => (forall m. MonadFree f m => m a) -> Free f a
improve m = lowerCodensity m
```

By now, it should be clear that the power of `Codensity` is sufficient to the task, but is it necessary?

More Soon.

\[Edit; Fixed minor typographical errors pointed out by ShinNoNoir, ivanm, and Josef Svenningsson, including a whole bunch of them found by Noah Easterly\]
