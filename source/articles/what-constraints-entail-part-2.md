[Last time](http://comonad.com/reader/2011/what-constraints-entail-part-1/) we derived an entailment relation for constraints, now let's get some use out of it.

## Reflecting Classes and Instances

Most of the implications we use on a day to day basis come from our class and instance declarations, but last time we only really dealt with constraint products.

For example given:

```haskell
#if 0
class Eq a => Ord a
instance Eq a => Eq [a]
#endif
```

we could provide the following witnesses

```haskell
ordEq :: Ord a :- Eq a
ordEq = Sub Dict

eqList :: Eq a :- Eq [a]
eqList = Sub Dict
```

But this would require a lot of names and become remarkably tedious.

So lets define classes to reflect the entailment provided by class definitions and instance declarations and then use them to reflect themselves.

```haskell
class Class b h | h -> b where
  cls :: h :- b

infixr 9 :=>
class b :=> h | h -> b where
  ins :: b :- h

instance Class () (Class b a) where cls = Sub Dict
instance Class () (b :=> a) where cls = Sub Dict
```

Now we can reflect classes and instances as instances of Class and (:=>) respectively with:

```haskell
-- class Eq a => Ord a where ...
instance Class (Eq a) (Ord a) where cls = Sub Dict
-- instance Eq a => Eq [a] where ...
instance Eq a :=> Eq [a] where ins = Sub Dict
```

That said, instances of Class and Instance should never require a context themselves, because the modules that the class and instance declarations live in can't taken one, so we can define the following instances which bootstrap the instances of (:=>) for Class and (:=>) once and for all.

```haskell
#ifdef UNDECIDABLE
instance Class b a => () :=> Class b a where ins = Sub Dict
instance (b :=> a) => () :=> b :=> a where ins = Sub Dict
#endif
```

These two instances are both decidable, and following a recent bug fix, the current version of GHC HEAD supports them, but my local version isn't that recent, hence the #ifdef.

We can also give admissable-if-not-ever-stated instances of Class and (:=>) for () as well.

```haskell
instance Class () () where cls = Sub Dict
instance () :=> () where ins = Sub Dict
```

## Reflecting the Prelude

So now that we've written a handful of instances, lets take the plunge and just reflect the entire Prelude, and (most of) the instances for the other modules we've loaded.

```haskell
instance Class () (Eq a) where cls = Sub Dict
instance () :=> Eq () where ins = Sub Dict
instance () :=> Eq Int where ins = Sub Dict
instance () :=> Eq Bool where ins = Sub Dict
instance () :=> Eq Integer where ins = Sub Dict
instance () :=> Eq Float where ins = Sub Dict
instance () :=> Eq Double where ins = Sub Dict
instance Eq a :=> Eq [a] where ins = Sub Dict
instance Eq a :=> Eq (Maybe a) where ins = Sub Dict
instance Eq a :=> Eq (Complex a) where ins = Sub Dict
instance Eq a :=> Eq (Ratio a) where ins = Sub Dict
instance (Eq a, Eq b) :=> Eq (a, b) where ins = Sub Dict
instance (Eq a, Eq b) :=> Eq (Either a b) where ins = Sub Dict
instance () :=> Eq (Dict a) where ins = Sub Dict
instance () :=> Eq (a :- b) where ins = Sub Dict
```

```haskell
instance Class (Eq a) (Ord a) where cls = Sub Dict
instance () :=> Ord () where ins = Sub Dict
instance () :=> Ord Bool where ins = Sub Dict
instance () :=> Ord Int where ins = Sub Dict
instance ():=> Ord Integer where ins = Sub Dict
instance () :=> Ord Float where ins = Sub Dict
instance ():=> Ord Double where ins = Sub Dict
instance () :=> Ord Char where ins = Sub Dict
instance Ord a :=> Ord (Maybe a) where ins = Sub Dict
instance Ord a :=> Ord [a] where ins = Sub Dict
instance (Ord a, Ord b) :=> Ord (a, b) where ins = Sub Dict
instance (Ord a, Ord b) :=> Ord (Either a b) where ins = Sub Dict
instance Integral a :=> Ord (Ratio a) where ins = Sub Dict
instance () :=> Ord (Dict a) where ins = Sub Dict
instance () :=> Ord (a :- b) where ins = Sub Dict
```

```haskell
instance Class () (Show a) where cls = Sub Dict
instance () :=> Show () where ins = Sub Dict
instance () :=> Show Bool where ins = Sub Dict
instance () :=> Show Ordering where ins = Sub Dict
instance () :=> Show Char where ins = Sub Dict
instance Show a :=> Show (Complex a) where ins = Sub Dict
instance Show a :=> Show [a] where ins = Sub Dict
instance Show a :=> Show (Maybe a) where ins = Sub Dict
instance (Show a, Show b) :=> Show (a, b) where ins = Sub Dict
instance (Show a, Show b) :=> Show (Either a b) where ins = Sub Dict
instance (Integral a, Show a) :=> Show (Ratio a) where ins = Sub Dict
instance () :=> Show (Dict a) where ins = Sub Dict
instance () :=> Show (a :- b) where ins = Sub Dict
```

```haskell
instance Class () (Read a) where cls = Sub Dict
instance () :=> Read () where ins = Sub Dict
instance () :=> Read Bool where ins = Sub Dict
instance () :=> Read Ordering where ins = Sub Dict
instance () :=> Read Char where ins = Sub Dict
instance Read a :=> Read (Complex a) where ins = Sub Dict
instance Read a :=> Read [a] where ins = Sub Dict
instance Read a :=> Read (Maybe a) where ins = Sub Dict
instance (Read a, Read b) :=> Read (a, b) where ins = Sub Dict
instance (Read a, Read b) :=> Read (Either a b) where ins = Sub Dict
instance (Integral a, Read a) :=> Read (Ratio a) where ins = Sub Dict
```

```haskell
instance Class () (Enum a) where cls = Sub Dict
instance () :=> Enum () where ins = Sub Dict
instance () :=> Enum Bool where ins = Sub Dict
instance () :=> Enum Ordering where ins = Sub Dict
instance () :=> Enum Char where ins = Sub Dict
instance () :=> Enum Int where ins = Sub Dict
instance () :=> Enum Integer where ins = Sub Dict
instance () :=> Enum Float where ins = Sub Dict
instance () :=> Enum Double where ins = Sub Dict
instance Integral a :=> Enum (Ratio a) where ins = Sub Dict
```

```haskell
instance Class () (Bounded a) where cls = Sub Dict
instance () :=> Bounded () where ins = Sub Dict
instance () :=> Bounded Ordering where ins = Sub Dict
instance () :=> Bounded Bool where ins = Sub Dict
instance () :=> Bounded Int where ins = Sub Dict
instance () :=> Bounded Char where ins = Sub Dict
instance (Bounded a, Bounded b) :=> Bounded (a,b) where ins = Sub Dict
```

```haskell
instance Class () (Num a) where cls = Sub Dict
instance () :=> Num Int where ins = Sub Dict
instance () :=> Num Integer where ins = Sub Dict
instance () :=> Num Float where ins = Sub Dict
instance () :=> Num Double where ins = Sub Dict
instance RealFloat a :=> Num (Complex a) where ins = Sub Dict
instance Integral a :=> Num (Ratio a) where ins = Sub Dict
```

```haskell
instance Class (Num a, Ord a) (Real a) where cls = Sub Dict
instance () :=> Real Int where ins = Sub Dict
instance () :=> Real Integer where ins = Sub Dict
instance () :=> Real Float where ins = Sub Dict
instance () :=> Real Double where ins = Sub Dict
instance Integral a :=> Real (Ratio a) where ins = Sub Dict
```

```haskell
instance Class (Real a, Enum a) (Integral a) where cls = Sub Dict
instance () :=> Integral Int where ins = Sub Dict
instance () :=> Integral Integer where ins = Sub Dict
```

```haskell
instance Class (Num a) (Fractional a) where cls = Sub Dict
instance () :=> Fractional Float where ins = Sub Dict
instance () :=> Fractional Double where ins = Sub Dict
instance RealFloat a :=> Fractional (Complex a) where ins = Sub Dict
instance Integral a :=> Fractional (Ratio a) where ins = Sub Dict
```

```haskell
instance Class (Fractional a) (Floating a) where cls = Sub Dict
instance () :=> Floating Float where ins = Sub Dict
instance () :=> Floating Double where ins = Sub Dict
instance RealFloat a :=> Floating (Complex a) where ins = Sub Dict
```

```haskell
instance Class (Real a, Fractional a) (RealFrac a) where cls = Sub Dict
instance () :=> RealFrac Float where ins = Sub Dict
instance () :=> RealFrac Double where ins = Sub Dict
instance Integral a :=> RealFrac (Ratio a) where ins = Sub Dict
```

```haskell
instance Class (RealFrac a, Floating a) (RealFloat a) where cls = Sub Dict
instance () :=> RealFloat Float where ins = Sub Dict
instance () :=> RealFloat Double where ins = Sub Dict
```

```haskell
instance Class () (Monoid a) where cls = Sub Dict
instance () :=> Monoid () where ins = Sub Dict
instance () :=> Monoid Ordering where ins = Sub Dict
instance () :=> Monoid [a] where ins = Sub Dict
instance Monoid a :=> Monoid (Maybe a) where ins = Sub Dict
instance (Monoid a, Monoid b) :=> Monoid (a, b) where ins = Sub Dict
```

```haskell
instance Class () (Functor f) where cls = Sub Dict
instance () :=> Functor [] where ins = Sub Dict
instance () :=> Functor Maybe where ins = Sub Dict
instance () :=> Functor (Either a) where ins = Sub Dict
instance () :=> Functor ((->) a) where ins = Sub Dict
instance () :=> Functor ((,) a) where ins = Sub Dict
instance () :=> Functor IO where ins = Sub Dict
```

```haskell
instance Class (Functor f) (Applicative f) where cls = Sub Dict
instance () :=> Applicative [] where ins = Sub Dict
instance () :=> Applicative Maybe where ins = Sub Dict
instance () :=> Applicative (Either a) where ins = Sub Dict
instance () :=> Applicative ((->)a) where ins = Sub Dict
instance () :=> Applicative IO where ins = Sub Dict
instance Monoid a :=> Applicative ((,)a) where ins = Sub Dict
```

```haskell
instance Class (Applicative f) (Alternative f) where cls = Sub Dict
instance () :=> Alternative [] where ins = Sub Dict
instance () :=> Alternative Maybe where ins = Sub Dict
```

```haskell
instance Class () (Monad f) where cls = Sub Dict
instance () :=> Monad [] where ins = Sub Dict
instance () :=> Monad ((->) a) where ins = Sub Dict
instance () :=> Monad (Either a) where ins = Sub Dict
instance () :=> Monad IO where ins = Sub Dict
```

```haskell
instance Class (Monad f) (MonadPlus f) where cls = Sub Dict
instance () :=> MonadPlus [] where ins = Sub Dict
instance () :=> MonadPlus Maybe where ins = Sub Dict
```

Of course, the structure of these definitions is extremely formulaic, so when template-haskell builds against HEAD again, they should be able to be generated automatically using splicing and reify, which would reduce this from a wall of text to a handful of lines with better coverage!

## An alternative using Default Signatures and Type Families

Many of the above definitions could have been streamlined by using default definitions. However, MPTCs do not currently support default signatures. We can however, define Class and (:=>) using type families rather than functional dependencies. This enables us to use defaulting, whenever the superclass or context was ().

```haskell
#if 0
class Class h where
  type Sup h :: Constraint
  type Sup h = ()
  cls :: h :- Sup h
  default cls :: h :- ()
  cls = Sub Dict

class Instance h where
  type Ctx h :: Constraint
  type Ctx h = ()
  ins :: Ctx h :- h
  default ins :: h => Ctx h :- h
  ins = Sub Dict

instance Class (Class a)
instance Class (Instance a)

#ifdef UNDECIDABLE
instance Class a => Instance (Class a)
instance Instance a => Instance (Instance a)
#endif

instance Class ()
instance Instance ()
#endif
```

This seems at first to be a promising approach. Many instances are quite small:

```haskell
#if 0
instance Class (Eq a)
instance Instance (Eq ())
instance Instance (Eq Int)
instance Instance (Eq Bool)
instance Instance (Eq Integer)
instance Instance (Eq Float)
instance Instance (Eq Double)
#endif
```

But those that aren't are considerably more verbose and are much harder to read off than the definitions using the MPTC based Class and (:=>).

```haskell
#if 0
instance Instance (Eq [a]) where
  type Ctx (Eq [a]) = Eq a
  ins = Sub Dict
instance Instance (Eq (Maybe a)) where
  type Ctx (Eq (Maybe a)) = Eq a
  ins = Sub Dict
instance Instance (Eq (Complex a)) where
  type Ctx (Eq (Complex a)) = Eq a
  ins = Sub Dict
instance Instance (Eq (Ratio a)) where
  type Ctx (Eq (Ratio a)) = Eq a
  ins = Sub Dict
instance Instance (Eq (a, b)) where
  type Ctx (Eq (a,b)) = (Eq a, Eq b)
  ins = Sub Dict
instance Instance (Eq (Either a b)) where
  type Ctx (Eq (Either a b)) = (Eq a, Eq b)
  ins = Sub Dict
#endif
```

Having tested both approaches, the type family approach led to a ~10% larger file size, and was harder to read, so I remained with MPTCs even though it meant repeating "where ins = Sub Dict" over and over.

In a perfect world, we'd gain the ability to use default signatures with multiparameter type classes, and the result would be considerably shorter and easier to read!

## Fake Superclasses

Now, that we have all this machinery, it'd be nice to get something useful out of it. Even if we could derive it by other means, it'd let us know we weren't completely wasting our time.

Let's define a rather horrid helper, which we'll only use where a and b are the same constraint being applied to a newtype wrapper of the same type, so we can rely on the fact that the dictionaries have the same representation.

```haskell
evil :: a :- b
evil = unsafeCoerce refl
```

We often bemoan the fact that we can't use Applicative sugar given just a Monad, since Applicative wasn't made a superclass of Monad due to the inability of the Haskell 98 report to foresee the future invention of Applicative.

There are rather verbose options to get Applicative sugar for your Monad, or to pass it to something that expects an Applicative. For instance you can use WrappedMonad from Applicative. We reflect the relevant instance here.

```haskell
instance Monad m :=> Applicative (WrappedMonad m) where ins = Sub Dict
```

Using that instance and the combinators defined previously, we can obtain the following

```haskell
applicative :: forall m a. Monad m => (Applicative m => m a) -> m a
applicative m =
  m \\ trans (evil :: Applicative (WrappedMonad m) :- Applicative m) ins
```

Here ins is instantiated to the instance of (:=>) above, so we use trans to compose `ins :: Monad m :- Applicative (WrappedMonad m)` with `evil :: Applicative (WrappedMonad m) :- Applicative m` to obtain an entailment of type `Monad m :- Applicative m` in local scope, and then apply that transformation to discharge the Applicative obligation on m.

Now, we can use this to write definitions. \[Note: Frustratingly, my blog software inserts spaces after <'s in code\]

```haskell
(< &>) :: Monad m => m a -> m b -> m (a, b)
m < &> n = applicative $ (,) < $> m < *> n
```

Which compares rather favorably to the more correct

```haskell
(< &>) :: Monad m => m a -> m b -> m (a, b)
m < &> n = unwrapMonad $ (,) < $> WrapMonad m < *> WrapMonad n
```

especially considering you still have access to any other instances on m you might want to bring into scope without having to use deriving to lift them onto the newtype!

Similarly you can borrow `< |>` and empty locally for use by your `MonadPlus` with:

```haskell
instance MonadPlus m :=> Alternative (WrappedMonad m) where ins = Sub Dict

alternative :: forall m a. MonadPlus m => (Alternative m => m a) -> m a
alternative m =
  m \\ trans (evil :: Alternative (WrappedMonad m) :- Alternative m) ins
```

The correctness of this of course relies upon the convention that any `Applicative` and `Alternative` your `Monad` may have should agree with its `Monad` instance, so even if you use `Alternative` or `Applicative` in a context where the actual `Applicative` or `Alternative` instance for your particular type m is in scope, it shouldn't matter beyond a little bit of efficiency which instance the compiler picks to discharge the `Applicative` or `Alternative` obligation.

Note: It isn't that the `Constraint` kind is invalid, but rather that using `unsafeCoerce` judiciously we can bring into scope instances that don't exist for a given type by substituting those from a different type which have the right representation.

\[[Source](https://github.com/ekmett/constraints/blob/master/Data/Constraint.hs)\]
