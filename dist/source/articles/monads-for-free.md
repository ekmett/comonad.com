Today I'd like to talk about free monads.

The free monad of a functor is a monad that is uniquely determined by the functor (up to isomorphism, etc), given by:

```haskell
data Free f a = Roll (f (Free f a)) | Return a
-- newtype Free f a = Free { unfree :: Either a (f (Free f a))) }
```

Usually the above is written up using a newtype around a sum (Either) so you can write it using nice point-free style, but I think this makes for clearer introduction this way.

The idea is that you take the functor and recursively fold it in upon a choice of either itself or a naked variable.

```haskell
instance Functor f => Functor (Free f) where
  fmap f (Roll x) = Roll $ fmap (fmap f) x
  fmap f (Return x) = Return (f x)
```

Now, we wouldn't call it the free 'monad' without reason. Return is the obvious candidate for 'return', but bind is a little trickier:

```haskell
instance Functor f => Monad (Free f) where
  return = Return
  Return m >>= k = k m -- given by: return m >>= k = k m
  Roll m >>= k = Roll $ fmap (>>= k) m
```

(>>=) substitutes 'subtrees' for all of the naked variables in our monad. This is the gist of the monads of (co)trees section of Uustalu and Vene's [The Dual of Substitution is Redecoration](http://citeseer.ist.psu.edu/uustalu02dual.html).

We can define a form of catamorphism for the free monad:

```haskell
foldF :: Functor f => (f a -> a) -> Free f a -> a
foldF phi (Roll x) = phi $ fmap (foldF phi) x
foldF _ (Return x) = x
```

The problem is you want to be able to perform different folds that return different types, so lets quantify over the variable in the monad.

```haskell
newtype Forall f = Forall { unforall :: forall a. f a }

cataF :: Functor f => (f a -> a) -> Forall (Free f) -> a
cataF phi = foldF phi . unforall
```

Lets motivate this with an example. Take the identity functor, and give it a funny name:

```haskell
data Succ a = Succ a
instance Functor Succ where
  fmap f (Succ a) = Succ (f a)
```

We can steal a nice typeclass from Laemmel and Rypacek:

```haskell
instance (Show a, Show (f (Free f a))) => Show (Free f a) where
  show (Roll x) = "(Roll (" ++ show x ++ "))"
  show (Return x) = "(Return (" ++ show x ++ "))"
```

And with it we can see that the members of the monad "Free Succ" are terms of the form:

```haskell
Return x
Roll (Succ (Return x))
Roll (Succ (Roll (Succ (Return x))))
...
```

Which if we look through it with goggles that quantify over x and ignore the Return/Roll noise looks like the Peano numerals!

```haskell
type Peano = Forall (Free Succ)
```

Then working in the monad "Free Succ", the bind function (>>=) hunts down the value of the 'a' term and substitutes the  
output of the function.

For example:

```haskell
Roll (Succ (Roll (Succ ()))) >>= const Roll (Succ ())
    == Roll (Succ (Roll (Succ (Roll (Succ ()))))
```

We can easily convert natural numbers to Peano form, exploiting this:

```haskell
toNat :: Int -> Free Succ ()
toNat n | n > 0 = toNat (n - 1) >> Succ ()
toNat 0         = return ()
```

And we can translate back from Peano form, by first replacing the () with a 0, and then using the non-polymorphic  
fold operation from before.

```haskell
toInt :: Free Succ a -> Int
toInt = foldF phi . fmap (const 0) where
  phi (Succ n) = n + 1
```

The need to set a constant base case is common enough that we may want to box that up into a function:

```haskell
cata' :: (f a -> a) -> a -> Forall (Free f) -> a
cata' phi z =  phi $ fmap (const z) . unforall
```

With that example in hand you might be tempted to try the same trick with a different type: (,)

First we note that (,) is a Bifunctor:

```haskell
class Bifunctor f where
  bimap :: (a -> c) -> (b -> d) -> f a b -> f c d
  first :: (a -> b) -> f a c -> f b c
  first f = bimap f id
  second :: (a -> b) -> f c a -> f c b
  second f = bimap id f
```

The definition for (,) is quite straightforward.

```haskell
instance Bifunctor (,) where
  bimap f g ~(x,y) = (f x, g y)

-- the reader comonad!
instance Functor ((,)a) where
  fmap f (e,a) = (e,f a)
```

Ideally we would like to be able to say

```haskell
--instance Bifunctor f => Functor (f a) where fmap = second
```

but this can lead to ambiguous cases in the type checker, does it look for a Bifunctor or something else? So, we'll just think that very loudly whenever we define a bifunctor.

So, lets see if Free ((,)a) x can rederive the list functor. You can get pretty close:

```haskell
Return x
Roll (a, Return x)
Roll (a, Roll (a, Return x))
...
```

Looks a lot like it, but its a different functor. The free monad "Free (Cons a)" varies the type of the term  
carried around in nil (aka Return) (the type of the result of applying a catamorphism). Quantifying over that gets you closer:

```haskell
newtype List a = List (Forall (Free ((,)a)))
```

We had to make it a newtype in order to be able to make it an instance of monad and functor in its own right.

Now, to remap the 'first' term in the bifunctor, we add a new tool to our belt:

```haskell
bimapfree :: Bifunctor f => (a -> b) -> Free (f a) c -> Free (f b) c
bimapfree f (Return x) = Return x
bimapfree f (Roll x) = Roll $ bimap f (bimapfree f) x
```

```haskell
instance Functor List where
  fmap f (List (Forall x)) = List $ Forall (bimapfree f x)
```

```haskell
length :: List a -> Int
length (List (Forall x)) = cata' phi 0 x where
  phi (_,b) = 1 + b

sum :: List Int -> Int
sum (List (Forall x)) = cata' phi 0 x where
  phi (a,b) = a + b
```

Now, if you've been paying attention for the last couple of posts, you may have noticed a connection between the free monad 'Free f a' and the Fegaras/Sheard 'Rec f a':

```haskell
data Rec f a = Roll (f (Rec f a)) | Place a
```

They are the same construction!

That said, when you have 'a' occurring in negative position in the functor (aka you have an exponential functor), then you find your hands tied in certain fundamental ways. First and foremost, the free monad fails to become a monad (well, in the category **Hask**, anyways)! Secondly you lose the ability to define hylomorphisms because the result of an anamorphism can't be turned into an input for a catamorphism.

More later.

\[Edit: corrected the definition of cataF based on an observation by Daniel James\]
