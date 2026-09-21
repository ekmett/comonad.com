Lenses are a great way to deal with functional references, but there are two common issues that arise from their use.

1.  There is a long-standing folklore position that lenses do not support polymorphic updates. This has actually caused a fair bit of embarrassment for the folks who'd like to incorporate lenses in any Haskell record system improvement.
2.  Access control. It'd be nice to have read-only or write-only properties -- "one-way" or "mirrored" lenses, as it were. Moreover, lenses are commonly viewed as an all or nothing proposition, in that it is hard to mix them with arbitrary user functions.
3.  Finally there is a bit of a cult around trying to generalize lenses by smashing a monad in the middle of them somewhere, it would be nice to be able to get into a list and work with each individual element in it without worrying about someone mucking up our lens laws, and perhaps avoid the whole generalized lens issue entirely.

We'll take a whack at each of these concerns in turn today.  

```haskell
   {-# LANGUAGE Rank2Types #-}  -- we'll relax this later
   import Data.Complex -- for complex examples
```

First, let us consider the type of van Laarhoven lenses:

```haskell
type Lens a b =
  forall f. Functor f =>
  (b -> f b) -> a -> f a
```

with a couple of examples:

```haskell
realLens :: RealFloat a => Lens (Complex a) a
realLens f (r :+ i) = fmap (:+ i) (f r)

imagLens :: RealFloat a => Lens (Complex a) a
imagLens f (r :+ i) = fmap (r :+) (f i)
```

These lenses have some very nice properties that we're going to exploit. By far their nicest property is that you can compose them using just `(.)` and `id` from the `Prelude` rather than having to go off and write a `Category`.

## Lens Families

[Russell O'Connor recently noted that these lenses permit polymorphic update](http://r6.ca/blog/20120623T104901Z.html) if you simply generalize their type signature to

```haskell
type LensFamily a b c d =
  forall f. Functor f =>
  (c -> f d) -> a -> f b
```

I'd like to note that you can't just let these 4 arguments vary with complete impunity, so I'll be referring to these as "lens families" rather than polymorphic lenses, a point that I'll address further below. In short, we want the original lens laws to still hold in spite of the generalized type signature, and this forces some of these types to be related.

As an aside, each of the other lens types admit this same generalization! For instance the `Lens` type in [data-lens](http://hackage.haskell.org/package/data-lens) can be generalized using an indexed store comonad:

```haskell
data Store c d b = Store (d -> b) c

instance Functor (Store c d) where
  fmap f (Store g c) = Store (f . g) c

newtype DataLensFamily a b c d = DataLensFamily (a -> Store c d b)
```

and we can freely convert back and forth to van Laarhoven lens families:

```haskell
dlens :: LensFamily a b c d -> DataLensFamily a b c d
dlens l = DataLensFamily (l (Store id))

plens :: DataLensFamily a b c d -> LensFamily a b c d
plens (DataLensFamily l) f a = case l a of
  Store g c -> fmap g (f c)
```

I leave it as an exercise to the reader to generalize the other lens types, but we'll stick to van Laarhoven lens families almost exclusively below.

As Russell noted, we can define functions to get, modify and set the target of a lens very easily. I'll create local names for `Identity` and `Const`, mostly to help give nicer error messages later.

We can read from a lens family:

```haskell
infixl 8 ^.
newtype Getting b a = Getting { got :: b }
instance Functor (Getting b) where
    fmap _ (Getting b) = Getting b
(^.) :: a -> ((c -> Getting c d) -> a -> Getting c b) -> c
x ^. l = got (l Getting x)
```

We can modify the target of the lens:

```haskell
newtype Setting a = Setting { unsetting :: a }
instance Functor Setting where
    fmap f (Setting a) = Setting (f a)
infixr 4 %=
(%=) :: ((c -> Setting d) -> a -> Setting b) -> (c -> d) -> a -> b
l %= f = unsetting . l (Setting . f)
```

We can set the target of the lens with impunity:

```haskell
infixr 4 ^=
(^=) :: ((c -> Setting d) -> a -> Setting b) -> d -> a -> b
l ^= v = l %= const v
```

We can build a lens family from a getter/setter pair

```haskell
lens :: (a -> c) -> (a -> d -> b) -> LensFamily a b c d
lens f g h a = fmap (g a) (h (f a))
```

or from a family of isomorphisms:

```haskell
iso :: (a -> c) -> (d -> b) -> LensFamily a b c d
iso f g h a = fmap g (h (f a))
```

With these combinators in hand, we need some actual lens families to play with. Fortunately they are just as easy to construct as simple lenses. The only thing that changes is the type signature.

```haskell
fstLens :: LensFamily (a,c) (b,c) a b
fstLens f (a,b) = fmap (\x -> (x,b)) (f a)

sndLens :: LensFamily (a,b) (a,c) b c
sndLens f (a,b) = fmap ((,) a) (f b)

swap :: (a,b) -> (b,a)
swap (a,b) = (b,a)

swapped :: LensFamily (a,b) (c,d) (b,a) (d,c)
swapped = iso swap swap
```

These can also build 'traditional' lenses:

```haskell
negated :: Num a => Lens a a
negated = iso negate negate
```

And since `Lens` and `LensFamily` are both type aliases, we can freely mix and match lenses with lens families:

```haskell
ghci> (1:+2,3) ^.fstLens.realLens
1.0
ghci> fstLens . realLens ^= 4 $ (1:+2,3)
(4.0 :+ 2.0,3)
```

But, we can now change types with our lens updates!

```haskell
ghci> (fstLens . sndLens ^= "hello") ((1,()),3)
((1,"hello"),3)
```

We can even do things like use the combinator

```haskell
traverseLens :: ((c -> c) -> a -> b) -> a -> b
traverseLens f = f id
```

to project a `Functor` out through an appropriate lens family:

```haskell
ghci> :t traverseLens (fstLens . sndLens)
traverseLens (fstLens . sndLens)
  :: Functor f => ((a, f b), c) -> f ((a, b), c)
```

That takes care of polymorphic updates.

## Why is it a Lens Family?

So, why do I use the term "lens family" rather than "polymorphic lens"?

In order for the lens laws to hold, the 4 types parameterizing our lens family must be interrelated.

In particular you need to be able to put back (with `^=`) what you get out of the lens (with `^.`) and put multiple times.

This effectively constrains the space of possible legal lens families to those where there exists an index kind `i`, and two type families `outer :: i -> *`, and `inner :: i -> *`. If this were a viable type signature, then each lens family would actually have 2 parameters, yielding something like:

```haskell
-- pseudo-Haskell
-- type LensFamily outer inner =
--    forall a b. LensFamily (outer a) (outer b) (inner a) (inner b)
```

but you can't pass in type families as arguments like that, and even if you could, their lack of injectivity doesn't give the type checker enough to work with to compose your lenses. By specifying all 4 type arguments independently, we give the compiler enough to work with. But since the arguments aren't just freely polymorphic and are instead related by these index types, I'm choosing to call them "lens families" rather than "polymorphic lenses".

## Getters

Note, we didn't use the full polymorphism of the van Laarhoven lenses in the signatures of `(^.)`, `(%=)` and `(^=)` above.

What happens when we restrict the type of `Functor` we're allowed to pass to our lens?

If we generalize the type of our getter ever so slightly from the type we pass to `(^.)` to permit composition, we get:

```haskell
type Getter a c = forall r d b. (c -> Getting r d) -> a -> Getting r b
```

and we can make getters out of arbitrary Haskell functions that we have lying around with

```haskell
-- | build a getting out of a function
getting :: (a -> b) -> Getter a b
getting g f = Getting . got . f . g
```

For example:

```haskell
getFst :: Getter (a,b) a
getFst = getting fst

getSnd :: Getter (a,b) b
getSnd = getting snd
```

But this is particularly nice for things that *can't* be made into real lenses or lens families, because of loss of information:

```haskell
getPhase :: RealFloat a => Getter (Complex a) a
getPhase = getting phase

getAbs, getSignum  :: Num a => Getter a a
getAbs = getting abs
getSignum = getting signum
```

Notably, `getMagnitude` and `getPhase` can't be legal lenses because when the `magnitude` is 0, you lose `phase` information.

These can be mixed and matched with other lenses when dereferencing with `(^.)`

```haskell
ghci> (0,(1:+2,3)) ^. getting snd . fstLens . getting magnitude
2.23606797749979
```

But we get a type error when we attempt to write to a `Getter`.

```haskell
ghci> getting magnitude ^= 12
<interactive>:2:1:
    Couldn't match expected type `Setting d0'
                with actual type `Getting r0 d1'
    Expected type: (c0 -> Setting d0) -> a1 -> Setting b1
      Actual type: (c0 -> Getting r0 d1) -> a0 -> Getting r0 b0
    In the return type of a call of `getting'
    In the first argument of `(^=)', namely `getting magnitude'
</interactive>
```

## Setters

So what about write-only properties?

These have a less satisfying solution. We have to break our lens family structure slightly to make something that can strictly *only* be written to, by disabling the ability to read our current value entirely.

```haskell
type Setter a d b = (() -> Setting d) -> a -> Setting b

setting :: (a -> d -> b) -> Setter a d b
setting f g a = Setting (f a (unsetting (g ())))
```

Now we can make setters out of functions that take two arguments:

```haskell
plus, times :: Num a => Setter a a a
plus = setting (+)
times = setting (*)
```

```haskell
ghci> setting (+) ^= 12 $ 32
44
ghci> fstLens . setting (*) ^= 12 $ (2,3)
(24,3)
```

However, these lenses have the unsatisfying property that they can only be placed last in the chain of lenses we're setting.

```haskell
ghci> (setting (+) . realLens ^= 12) 1
<interactive>:15:16:
    Couldn't match expected type `()' with actual type `Complex d0'
    Expected type: (d0 -> Setting d0) -> () -> Setting b0
      Actual type: (d0 -> Setting d0)
                   -> Complex d0 -> Setting (Complex d0)
    In the second argument of `(.)', namely `realLens'
    In the first argument of `(^=)', namely `setting (+) . realLens'
</interactive>
```

This isn't surprising, if you consider that to compose `data-lens` lenses you need to use `%=` to chain setters.

## Modifiers

So what do we need to do to make a lens we can only modify but not read?

Lets restore the lens family structure!

```haskell
type Modifier a b c d = (c -> Setting d) -> a -> Setting b

modifying :: ((c -> d) -> a -> b) -> Modifier a b c d
modifying f g a = Setting (f (unsetting . g) a)
```

`modifying` makes a modify-only lens family you can modify using local information, but can't tell anyone about the contents of.

This lets us work with a lens over a variable number of elements in a structure, without worrying about a user accidentally "putting back" too many or too few entries.

```haskell
ghci> modifying map %= (+1) $ [1,2,3]
[2,3,4]
```

They can be composed with other lenses:

```haskell
ghci> modifying map . sndLens %= (+1) $ [("hello",1),("goodbye",2)]
[("hello",2),("goodbye",3)]
```

and unlike with a `Setter`, you can compose a `Modifier` with a `Modifier`:

```haskell
modifying fmap . modifying fmap
  :: (Functor g, Functor f) =>
     (c -> Setting d) -> f (g c) -> Setting (f (g d))
```

but they cannot be read from directly:

```haskell
ghci> [1,2,3] ^. modifying fmap
<interactive>:18:12:
    Couldn't match expected type `Getting c0 d0'
                with actual type `Setting d1'
    Expected type: (c0 -> Getting c0 d0) -> [t0] -> Getting c0 b1
      Actual type: Modifier a0 b0 c0 d1
    In the return type of a call of `modifying'
    In the second argument of `(^.)', namely `modifying map'
</interactive>
```

We can map over restricted domains:

```haskell
reals :: (RealFloat a, RealFloat b) => Modifier (Complex a) (Complex b) a b
reals = modifying (\f (r :+ i) -> f r :+ f i)
```

and everything still composes:

```haskell
ghci> reals %= (+1) $  1 :+ 2
2 :+ 3
ghci> fstLens . reals %= (+1) $ (1 :+ 2, 4)
(2.0 :+ 3.0,4)
```

These aren't limited to actions that map over the entire structure, however!

```haskell
ghci> :m + Data.Lens
ghci> modifying (`adjust` "goodbye") %= (+1) $
      fromList [("hello",1),("goodbye",2)]
fromList [("goodbye",3),("hello",1)]
```

This lets us update potentially nested structures where something may or may not be present , which was fairly tedious to do with earlier lens representations.

Both the former map-like example and the latter update-like behavior were commonly used examples in calls for partial lenses or 'multi-lenses', but here they are able to implemented using a restricted form of a more traditional lens type, and moreover they compose cleanly with other lenses and lens families.

## Rank-1 Lens Families

At the very start I mentioned that you can dispense with the need for Rank-2 Types. Doing so requires much more tedious type signatures as the `LensFamily`, `Getter`, `Setter` and `Lens` aliases are no longer legal. Also, if you want to take a lens as an argument and use it in multiple contexts (e.g. as both a getter and a setter), you'll need to clone it to obtain a lens family. For example, this fails:

```haskell
ghci> :t \l y -> l ^= y ^. l + 1 $ y
<interactive>:1:19:
    Couldn't match expected type `Getting d0 d1'
                with actual type `Setting d0'
    Expected type: (d0 -> Getting d0 d1) -> a1 -> Getting d0 b1
      Actual type: (d0 -> Setting d0) -> a0 -> Setting b0
    In the second argument of `(^.)', namely `l'
    In the first argument of `(+)', namely `y ^. l'
</interactive>
```

But we can clone the supplied monomorphic lens using the composition of `dlens` and `plens` above, since the `DataLensFamily` completely characterizes the `LensFamily` with:

```haskell
clone ::
  ((c -> Store c d d) -> (a -> Store c d b)) ->
  LensFamily a b c d
clone l f a = case l (Store id) a of
  Store g c -> fmap g (f c)
```

and then the following code type checks:

```haskell
ghci> :t \l y -> clone l ^= y ^. clone l + 1 $ y
\l y -> clone l ^= y ^. clone l + 1 $ y
  :: Num d => ((c -> Store c d1 d1) -> a -> Store d d b) -> a -> b
```

This means you could implement an entire library to deal with lens families with restricted getters and setters and remain within the confines of Haskell 98. However, the type signatures are considerably less elegant than what becomes available when you simply add Rank2Types.

## Conclusion

So, we've demonstrated that van Laarhoven lens families let you have lenses that permit polymorphic update, let you offer lenses that are restricted to only allowing the use of getters, setters or modifiers, while granting you easy composition with the existing `(.)` and `id` from the `Prelude`.

I think the practical existence and power of these combinators make a strong case for their use in any serious record reform proposal.

My thanks go to Russell O'Connor. He first noticed that you can generalize van Laarhoven lenses and proposed the `clone` combinator as a path to Haskell 98/2010 compatibility, while retaining the nicer composition model.
