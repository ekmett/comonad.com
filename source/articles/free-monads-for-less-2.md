[Last time](http://comonad.com/reader/2011/free-monads-for-less/), I started exploring whether or not [Codensity](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/Control-Monad-Codensity.html) was necessary to [improve the asymptotic performance of free monads](http://www.iai.uni-bonn.de/~jv/mpc08.pdf).

This time I'll show that the answer is no; we can get by with something smaller.

## The Yoneda Lemma

Another form of right Kan extension arises from the [Yoneda lemma](http://en.wikipedia.org/wiki/Yoneda_lemma).

I covered it briefly in [my initial article on Kan extensions](http://comonad.com/reader/2008/kan-extensions/), but the inestimable Dan Piponi wrote a [much nicer article](http://blog.sigfpe.com/2006/11/yoneda-lemma.html) on how it implies in Haskell that given a `Functor` instance on *f*, this type

```haskell
newtype Yoneda f a = Yoneda (forall r. (a -> r) -> f r)
```

is isomorphic to `f a`, witnessed by these natural transformations:

```haskell
liftYoneda :: Functor f => f a -> Yoneda f a
liftYoneda a = Yoneda (\f -> fmap f a)

lowerYoneda :: Yoneda f a -> f a
lowerYoneda (Yoneda f) = f id
```

That said, *you are not limited to applying `Yoneda` to types that have `Functor` instances*.

This type and these functions are provided by [Data.Functor.Yoneda](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/Data-Functor-Yoneda.html) from the [kan-extensions](http://hackage.haskell.org/package/kan-extensions) package.

## Codensity vs. Yoneda

Note, `Yoneda f` is in some sense smaller than `Codensity f`, as `Codensity f a` is somewhat 'bigger' than `f a`, despite providing an embedding, while `Yoneda f a` is isomorphic.

For example, `Codensity ((->) s) a` is isomorphic to `State s a`, not to `s -> a` as shown by:

```haskell
instance MonadState s (Codensity ((->) s)) where
   get = Codensity (\k s -> k s s)
   put s = Codensity (\k _ -> k () s)
```

Now, `Codensity` is a particular form of right Kan extension, which always yields a `Monad`, **without needing anything from *f***.

Here we aren't so fortunate, but we do have the fact that `Yoneda f` is always a `Functor`, regardless of what *f* is, as shown by:

```haskell
instance Functor (Yoneda f) where
  fmap f (Yoneda m) = Yoneda (\k -> m (k . f))
```

which was obtained just by cutting and pasting the appropriate definition from `Codensity` or `ContT`, and comes about because `Yoneda` is a right Kan extension, like all of those.

To get a `Monad` instance for `Yoneda f` we need to lean on *f* somehow.

One way is to just borrow a `Monad` instance from *f*, since `f a` is isomorphic to `Yoneda f a`, if we have a `Functor` for *f*, and if we have a `Monad`, we can definitely have a `Functor`.

```haskell
instance Monad m => Monad (Yoneda m) where
  return a = Yoneda (\f -> return (f a))
  Yoneda m >>= k = Yoneda (\f -> m id >>= \a -> runYoneda (k a) f)
```

## Map Fusion and Reassociating Binds

Unlike `Codensity` the monad instance above isn't very satisfying, because it uses the `>>=` of the underlying monad, and as a result the `>>=`s will wind up in the same order they started.

On the other hand, the `Functor` instance for `Yoneda f` is still pretty nice because the `(a -> r)` part of the type acts as an accumulating parameter fusing together uses of `fmap`.

This is apparent if you expand `lowerYoneda . fmap f . fmap g . liftYoneda` , whereupon you can see we only call `fmap` on the underlying `Functor` once.

Intuitively, you can view `Yoneda` as a type level construction that ensures that you get `fmap` fusion, while `Codensity` is a type level construction that ensures that you right associate binds. It is important to note that `Codensity` also effectively accumulates `fmap`s, as it uses the same definition for `fmap` as `Yoneda`!

With this in mind, it doesn't usually make much sense to use `Codensity (Codensity m)` or `Yoneda (Yoneda m)` because the purpose being served is redundant.

Less obviously, `Codensity (Yoneda m)` is also redundant, because as noted above, `Codensity` also does `fmap` accumulation.

## Other Yoneda-transformed Monads

Now, I said one way to define a `Monad` for `Yoneda f` was to borrow an underlying `Monad` instance for *f*, but this isn't the only way.

Consider `Yoneda Endo`. Recall that `Endo` from [Data.Monoid](http://www.haskell.org/ghc/docs/6.12.2/html/libraries/base-4.2.0.1/Data-Monoid.html) is given by

```haskell
newtype Endo a = Endo { appEndo :: a -> a }
```

Clearly `Endo` is not a `Monad`, it can't even be a `Functor`, because *a* occurs in both positive and negative position.

Nevertheless `Yoneda Endo` **can** be made into a monad -- the continuation passing style version of the `Maybe` monad!

```haskell
newtype YMaybe a = YMaybe (forall r. (a -> r) -> r -> r)
```

I leave the rather straightforward derivation of this `Monad` for the reader. A version of it is present in [monad-ran](http://comonad.com/haskell/monad-ran/dist/doc/html/monad-ran/Control-Monad-Ran.html).

This lack of care for capital-F `Functor`iality also holds for `Codensity`, `Codensity Endo` can be used as a two-continuation list monad. It is isomorphic to the non-transformer version of [Oleg et al.'s LogicT](http://okmij.org/ftp/papers/LogicT.pdf), which is available on hackage as [logict](http://hackage.haskell.org/packages/archive/logict/0.4.2/doc/html/Control-Monad-Logic.html) from my coworker, Dan Doel.

The `Functor`, `Applicative`, `Monad`, `MonadPlus` and many other instances for `LogicT` can be rederived in their full glory from `Codensity (GEndo m)` automatically, where

```haskell
newtype GEndo m r = GEndo (m r -> m r)
```

without any need for conscious thought about how the continuations are plumbed through in the `Monad`.

## Bananas in Space

One last digression,

```haskell
newtype Rec f r = (f r -> r) -> r
```

came up once previously on this blog in [Rotten Bananas](http://comonad.com/reader/2008/rotten-bananas/). In that post, I talked about how Fegaras and Sheard used a free monad (somewhat obliquely) in "[Revisiting catamorphisms over datatypes with embedded functions](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.36.2763)" to extend catamorphisms to deal with strong HOAS, and then talked further about how Stephanie Weirich and Geoffrey Washburn [used Rec](http://citeseer.ist.psu.edu/viewdoc/summary?doi=10.1.1.80.2219) to replace the free monad used by Fegaras and Sheard. That said, they did so in a more restricted context, where any mapping was done by giving us both an embedding and a projection pair.

## Going to Church

We can't just use `Rec f a` instead of `Free f a` here, because `Free f a` is a functor, while `Rec f a` is emphatically not.

However, if we apply `Yoneda` to `Rec f`, we obtain a Church-encoded continuation-passing-style version of `Free`!

```haskell
newtype F f a = F { runF :: forall r. (a -> r) -> (f r -> r) -> r }
```

Since this is of the form of `Yoneda (Rec f)`, it is clearly a `Functor`:

```haskell
instance Functor (F f) where
   fmap f (F g) = F (\kp -> g (kp . f))
```

And nicely, **without knowing anything about *f***, we also get a `Monad`!

```haskell
instance Monad (F f) where
   return a = F (\kp _ -> kp a)
   F m >>= f = F (\kp kf -> m (\a -> runF (f a) kp kf) kf)
```

But when we `>>=` all we do is change the continuation for `(a -> r)`, leaving the *f*\-algebra, `(f r -> r)`, untouched.

Now, `F` is a monad transformer:

```haskell
instance MonadTrans F where
   lift f = F (\kp kf -> kf (liftM kp f))
```

which is unsurprisingly, effectively performing the same operation as lifting did in `Free`.

Heretofore, we've ignored everything about *f* entirely.

This has pushed the need for the `Functor` on *f* into the wrapping operation:

```haskell
instance Functor f => MonadFree f (F f) where
   wrap f = F (\kp kf -> kf (fmap (\ (F m) -> m kp kf) f))
```

Now, we can clearly transform from our representation to any other free monad representation:

```haskell
fromF :: MonadFree f m => F f a -> m a
fromF (F m) = m return wrap
```

or to it from our original canonical ADT-based free monad representation:

```haskell
toF :: Functor f => Free f a -> F f a
toF xs = F (\kp kf -> go kp kf xs) where
  go kp _  (Pure a) = kp a
  go kp kf (Free fma) = kf (fmap (go kp kf) fma)
```

So, `F f a` is isomorphic to `Free f a`.

So, looking at `Codensity (F f) a` as `Codensity (Yoneda (Rec f))`, it just seems silly.

As we mentioned before, we should be able to go from `Codensity (Yoneda (Rec f)) a` to `Codensity (Rec f) a`, since `Yoneda` was just fusing uses of `fmap`, while `Codensity` was fusing `fmap` while right-associating `(>>=)`'s.

## Swallowing the Bigger Fish

So, the obvious choice is to try to optimize to `Codensity (Rec f) a`. If you go through the motions of encoding that you get:

```haskell
newtype CF f a = CF (forall r. (a -> (f r -> r) -> r) -> (f r -> r) -> r)
```

which is in some sense larger than `F f a`, because the first continuation gets both an *a* and an *f*\-algebra `(f r -> r)`.

But tellingly, once you write the code, the first continuation **never uses the extra *f*\-algebra you supplied it!**

So `Codensity (Yoneda (Rec f)) a` gives us nothing of interest that we don't already have in `Yoneda (Rec f) a`.

Consequently, in this special case rather than letting `Codensity (Yoneda x) a` swallow the `Yoneda` to get `Codensity x a` we can actually let the `Yoneda` swallow the surrounding `Codensity` obtaining `Yoneda (Rec f) a`, the representation we started with.

## Scott Free

Finally, you might ask if a Church encoding is as simple as we could go. After all a Scott encoding

```haskell
newtype ScottFree f a = ScottFree
    { runScottFree :: forall r.
       (a -> r) -> (f (ScottFree f a) -> r) -> r
    }
```

would admit easier pattern matching, and a nice pun, and seems somewhat conceptually simpler, while remaining isomorphic.

But the `Monad` instance:

```haskell
instance Functor f => Monad (ScottFree f) where
   return a = ScottFree (\kp _ -> kp a)
   ScottFree m >>= f = ScottFree
       (\kb kf -> m (\a -> runScottFree (f a) kb kf) (kf . fmap (>>= f)))
```

needs to rely on the underlying bind, and you can show that it won't do the right thing with regards to reassociating.

So, alas, we cannot get away with `ScottFree`.

## Nobody Sells for Less

So, now we can rebuild Voigtländer's `improve` using our Church-encoded / Yoneda-based free monad `F`, which is precisely isomorphic to `Free`, by using

```haskell
lowerF :: F f a -> Free f a
lowerF (F f) = f Pure Free
```

to obtain

```haskell
improve :: (forall a. MonadFree f m => m a) -> Free f a
improve m = lowerF m
```

And since our Church-encoded free monad is isomorphic to the simple ADT encoding, our new solution is as small as it can get.

Next time, we'll see this construction in action!
