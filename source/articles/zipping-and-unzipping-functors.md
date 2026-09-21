Kefer asked a question in the comments of my post about [(co)monadic (co)strength](http://comonad.com/reader/2008/deriving-strength-from-laziness/) about Uustalu and Vene's ComonadZip class from p157 of [The Essence of Dataflow Programming](http://cs.ioc.ee/~tarmo/papers/cefp05.pdf). The class in question is:

```haskell
class Comonad w => ComonadZip w where
     czip :: f a -> f b -> f (a, b)
```

In response I added [Control.Functor.Zip](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Functor-Zip.html) \[[Source](http://comonad.com/haskell/category-extras/src/Control/Functor/Zip.hs)\] to my nascent rebundled version of category-extras, which was posted up to hackage earlier today.

Putting aside the dual operation for the moment, we can dispense with the inverse of zip quite simply, for much the same reason that every functor in Haskell is strong, every functor in haskell is unzippable:

```haskell
unfzip :: Functor f => f (a, b) -> (f a, f b)
unfzip = fmap fst &&& fmap snd
```

On the other hand the question of what Functors are zippable is a little trickier. Allowing for a circular definition between fzip and fzipWith we can start with the following class for which you have to implement at least one of fzip or fzipWith.

```haskell
class Functor f => Zip f where
  fzip :: f a -> f b -> f (a, b)
  fzip = fzipWith (,)
  fzipWith :: (a -> b -> c) -> f a -> f b -> f c
  fzipWith f as bs = fmap (uncurry f) (fzip as bs)
```

Here we set aside the restriction that we only be able to Zip a comonad, and simply require that if the functor in question is a comonad, then it is a "symmetric semi-monoidal comonad", which is to say that zipping and then extracting yields the same result as extracting from each separately. You may note a lot of similarity in the above to the definition for [Control.Functor.Zap](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Functor-Zap.html) the Dual functor from [the other day](http://comonad.com/reader/2008/the-cofree-comonad-and-the-expression-problem/).

Now, we can throw ourselves with reckless abandon at the easy cases:

```haskell
instance Zip Identity where
  fzipWith f (Identity a) (Identity b) = Identity (f a b)

instance Zip [] where
  fzip = zip
  fzipWith = zipWith

instance Zip Maybe where
  fzipWith f (Just a) (Just b) = Just (f a b)
  fzipWith f _ _ = Nothing
```

But we note that Either causes us to break down, we can't handle the 'mixed' cases of Left and Right cleanly. We can however use the same 'cheat' that makes the Writer Monad work, however, and rely on an instance of Monoid, and leaving the left hand side of the bifunctor unchanged to enable us to define:

```haskell
instance Monoid a => Zip (Either a) where
  fzipWith f (Left a) (Left b) = Left (mappend a b)
  fzipWith f (Right a) (Left b) = Left b
  fzipWith f (Left a) (Right b) = Left a
  fzipWith f (Right a) (Right b) = Right (f a b)
```

and similarly:

```haskell
instance Monoid a => Zip ((,)a) where
  fzipWith f (a, c) (b, d) = (mappend a b, f c d)
```

Unfortunately the instance for ((,)a) is a little less than satisfying, what we really want to say there is that we have a [Bifunctor](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Bifunctor.html#t%3ABifunctor) and that it has two parameters that can be zipped together:

```haskell
class Bifunctor p => Bizip p where
  bizip :: p a c -> p b d -> p (a,b) (c,d)
  bizip = bizipWith (,) (,)
  bizipWith :: (a -> b -> e) -> (c -> d -> f) -> p a c -> p b d -> p e f
  bizipWith f g as bs = bimap (uncurry f) (uncurry g) (bizip as bs)
```

Now, we can define a more satisfying instance for (,):

```haskell
instance Bizip (,) where
  bizipWith f g (a,b) (c,d) = (f a c, g b d)
```

However, by its very nature, an instance for Either eludes us.

Now, we can define a "Bifunctor-Functor-Functor Bifunctor" transformer that takes a bifunctor and a pair of functors to wrap it around, and derives a new bifunctor and lift the zippability of each of the parts to the zippability of the whole:

```haskell
newtype BiffB p f g a b = BiffB { runBiffB :: p (f a) (g b) }

instance (Functor f, Bifunctor p, Functor g) => Bifunctor (BiffB p f g) where
  bimap f g = BiffB . bimap (fmap f) (fmap g) . runBiffB

instance (Zip f, Bizip p, Zip g) => Bizip (BiffB p f g) where
  bizipWith f g as bs = BiffB $ bizipWith (fzipWith f) (fzipWith g) (runBiffB as) (runBiffB bs)
```

What is interesting about this is that the [cofree comonad](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Comonad-Cofree.html) and [free monad](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Monad-Free.html) can be defined in terms of BiffB given a definition for the [fixed point of a bifunctor](http://comonad.com/haskell/category-extras/src/Control/Bifunctor/Fix.hs):

```haskell
newtype FixB s a = InB { outB :: s a (FixB s a) }

instance Bifunctor s => Functor (FixB s) where
  fmap f = InB . bimap f (fmap f) . outB

type Cofree f a = FixB (BiffB (,) Identity f) a
type Free f a = FixB (BiffB Either Identity f) a
```

Then we can define that the fixed point of a zippable bifunctor is a zippable functor:

```haskell
instance Bizip p => Zip (FixB p) where
  fzipWith f as bs = InB $ bizipWith f (fzipWith f) (outB as) (outB bs)
```

Then it immediately follows by the construction for BiffB that every Cofree Comonad of a zippable base functor is Zippable because they are the fixed point of BiffB (,) Identity f. and since (,) is zippable and Identity is zippable, then given f zippable the base bifunctor is zippable, so Cofree f is zippable.

On the other hand, we do not get the same result for the [Free Monad](http://comonad.com/reader/2008/monads-for-free/), because it is built over BiffB Either Identity f, and Either is not a zippable bifunctor.

We can define some other functors and bifunctors which are zippable, i.e. we can define a ["functor-wrapped bifunctor bifunctor"](http://comonad.com/haskell/category-extras/dist/doc/html/category-extras/Control-Bifunctor-Composition.html#t%3AFunctorB):

```haskell
newtype FunctorB f p a b = FunctorB { runFunctorB :: f (p a b) }

liftFunctorB :: Functor f => (p a b -> p c d) -> FunctorB f p a b -> FunctorB f p c d
liftFunctorB f = FunctorB . fmap f . runFunctorB

instance (Functor f, Bifunctor p) => Bifunctor (FunctorB f p) where
  bimap f g = liftFunctorB (bimap f g)

instance (Zip f, Bizip p) => Bizip (FunctorB f p) where
  bizipWith f g as bs = FunctorB $ fzipWith (bizipWith f g) (runFunctorB as) (runFunctorB bs)
```

But the general pattern was set by Either and Maybe. Whenever your functor has a branch you need a way to uniquely determine the way the constant terms combine.

While I think the above yields a pleasingly generic version of zip. I do not believe that I have exhausted the set of possible instances, but yielding them automatically for cofree comonads of zippable functors, and hence for rose trees, streams, was rather nice.

If you have any other instances of note, I would welcome the insight.

\[[category-extras-0.44.1](http://hackage.haskell.org/cgi-bin/hackage-scripts/package/category-extras-0.44.1)\]
