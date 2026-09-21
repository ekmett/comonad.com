Today I hope to start a new series of posts exploring constructive abstract algebra in Haskell.

In particular, I want to talk about a novel encoding of linear functionals, polynomials and linear maps in Haskell, but first we're going to have to build up some common terminology.

Having obtained the blessing of Wolfgang Jeltsch, I replaced the [algebra](http://hackage.haskell.org/package/algebra) package on hackage with something... bigger, although still very much a work in progress.

## (Infinite) Modules over Semirings

Recall that a vector space **V** over a field **F** is given by an additive Abelian group on **V**, and a scalar multiplication operator  
`(.*) :: F -> V -> V` subject to distributivity laws

```haskell
s .* (u + v) = s .* u + s .* v
(s + t) .* v = s .* v + t .* v
```

and associativity laws

```haskell
   (s * t) .* v = s .* (t .* v)
```

and respect of the unit of the field.

```haskell
   1 .* v = v
```

Since multiplication on a field is commutative, we can also add

```haskell
  (*.) :: V -> F -> V
  v *. f = f .* v
```

with analogous rules.

But when F is only a [Ring](http://en.wikipedia.org/wiki/Ring_\(mathematics\)), we call the analogous structure a module, and in a ring, we can't rely on the commutativity of multiplication, so we may have to deal left-modules and right-modules, where only one of those products is available.

We can weaken the structure still further. If we lose the negation in our Ring we and go to a [Rig](http://en.wikipedia.org/wiki/Semiring) (often called a Semiring), now our module is an additive moniod.

If we get rid of the additive and multiplicative unit on our Rig we get down to what some authors call a Ringoid, but which we'll call a [Semiring](http://hackage.haskell.org/packages/archive/algebra/0.3.0/doc/html/Numeric-Semiring-Class.html) here, because it makes the connection between semiring and semigroup clearer, and the *\-oid* suffix is dangerously overloaded due to category theory.

First we'll define additive semigroups, because I'm going to need both additive and multiplicative monoids over the same types, and Data.Monoid has simultaneously too much and too little structure.

```haskell
-- (a + b) + c = a + (b + c)
class Additive m where
  (+) :: m -> m -> m
  replicate1p :: Whole n => n -> m -> m -- (ignore this for now)
  -- ...
```

their Abelian cousins

```haskell
-- a + b = b + a
class Additive m => Abelian m
```

and Multiplicative semigroups

```haskell
-- (a * b) * c = a * (b * c)
class Multiplicative m where
  (*) :: m -> m -> m
  pow1p :: Whole n => m -> n -> m
  -- ...
```

Then we can define a semirings

```haskell
-- a*(b + c) = a*b + a*c
-- (a + b)*c = a*c + b*c
class (Additive m, Abelian m, Multiplicative m) => Semiring
```

With that we can define modules over a semiring:

```haskell
-- r .* (x + y) = r .* x + r .* y
-- (r + s) .* x = r .* x + s .* x
-- (r * s) .* x = r .* (s .* x)
class (Semiring r, Additive m) => LeftModule r m
   (.*) :: r -> m -> m
```

and analogously:

```haskell
class (Semiring r, Additive m) => RightModule r m
   (*.) :: m -> r -> m
```

For instance every additive semigroup forms a semiring module over the positive natural numbers (1,2..) using replicate1p.

If we know that our addition forms a monoid, then we can form a module over the naturals as well

```haskell
-- | zero + a = a = a + zero
class
    (LeftModule Natural m,
    RightModule Natural m
    ) => AdditiveMonoid m where
   zero :: m
   replicate :: Whole n => n -> m -> m
```

and if our addition forms a group, then we can form a module over the integers

```haskell
-- | a + negate a = zero = negate a + a
class
    (LeftModule Integer m
    , RightModule Integer m
    ) => AdditiveGroup m where
  negate :: m -> m
  times :: Integral n => n -> m -> m
  -- ...
```

## Free Modules over Semirings

A free module on a set E, is a module where the basis vectors are elements of E. Basically it is |E| copies of some (semi)ring.

In Haskell we can represent the free module of a ring directly by defining the action of the (semi)group pointwise.

```haskell
instance Additive m => Additive (e -> m) where
   f + g = \x -> f x + g x

instance Abelian m => Abelian (e -> m)

instance AdditiveMonoid m => AdditiveMonoid (e -> m) where
   zero = const zero

instance AdditiveGroup m => AdditveGroup (e -> m) where
   f - g = \x -> f x - g x
```

We could define the following

```haskell
instance Semiring r => LeftModule r (e -> m) where
   r .* f = \x -> r * f x
```

but then we'd have trouble dealing with the Natural and Integer constraints above, so instead we lift modules

```haskell
instance LeftModule r m => LeftModule r (e -> m) where
   (.*) m f e = m .* f e

instance RightModule r m => RightModule r (e -> m) where
   (*.) f m e = f e *. m
```

We **could** go one step further and define multiplication pointwise, but while the direct product of |e| copies of a ring \_does\_ define a ring, and this ring is the one provided by the Conal Elliot's [`vector-space`](http://code.haskell.org/vector-space/) package, it isn't the most general ring we could construct. But we'll need to take a detour first.

## Linear Functionals

A Linear functional f on a module M is a linear function from a M to its scalars R.

That is to say that, f : M -> R such that

```haskell
f (a .* x + y) = a * f x + f y
```

Consequently linear functionals also form a module over R. We call this module the dual module M\*.

Dan Piponi has blogged about these dual vectors (or covectors) in the context of trace diagrams.

If we limit our discussion to free modules, then M = E -> R, so a linear functional on M looks like `(E -> R) -> R`  
*subject to additional linearity constraints* on the result arrow.

The main thing we're not allowed to do in our function is apply our function from E -> R to two different E's and then multiply the results together. Our pointwise definitions above satisfy those linearity constraints, but for example:

```haskell
bad f = f 0 * f 0
```

does not.

We *could* capture this invariant in the type by saying that instead we want

```haskell
newtype LinearM r e =
  LinearM {
    runLinearM :: forall r. LeftModule r m => (e -> m) -> m
  }
```

we'd have to make a new such type every time we subclassed Semiring. I'll leave further exploration of this more exotic type to another time. (Using some technically illegal module instances we can recover more structure that you'd expect.)

Now we can package up the type of covectors/linear functionals:

```haskell
infixr 0 $*
newtype Linear r a = Linear { ($*) :: (a -> r) -> r }
```

The sufficiently observant may have already noticed that this type is the same as the Cont monad (subject to the linearity restriction on the result arrow).

In fact the `Functor`, `Monad`, `Applicative` instances for `Cont` all carry over, and **preserve linearity**.

(We lose `callCC`, but that is at least partially due to the fact that `callCC` has a less than ideal type signature.)

In addition we get a number of additional instances for `Alternative`, `MonadPlus`, by exploiting the knowledge that r is ring-like:

```haskell
instance AdditiveMonoid r => Alternative (Linear r a) where
  Linear f < |> Linear g = Linear (f + g)
  empty = Linear zero
```

Note that the `(+)` and `zero` there are the ones defined on functions from our earlier free module construction!

## Linear Maps

Since `Linear r` is a monad, `Kleisli (Linear r)` forms an `Arrow`:

```haskell
b -> ((a -> r) ~> r)
```

where the ~> denotes the arrow that is constrained to be linear.

If we swap the order of the arguments so that

```haskell
(a -> r) ~> (b -> r)
```

this arrow has a very nice meaning! (See [Numeric.Map.Linear](http://hackage.haskell.org/packages/archive/algebra/0.4.0/doc/html/Numeric-Map-Linear.html))

```haskell
infixr 0 $#
newtype Map r b a = Map { ($#) :: (a -> r) -> (b -> r) }
```

`Map r b a` represents the type of [linear maps](http://en.wikipedia.org/wiki/Linear_map) from `a -> b`. Unfortunately due to contravariance the arguments wind up in the "wrong" order.

```haskell
instance Category (Map r) where
  Map f . Map g = Map (g . f)
  id = Map id
```

So we can see that a linear map from a module A with basis `a` to a vector space with basis `b` effectively consists of |b| linear functionals on A.

`Map r b a` provides a lot of structure. It is a valid instance of [an insanely large number of classes](https://github.com/ekmett/algebra/blob/master/Numeric/Map/Linear.hs).

## Vectors and Covectors

In physics, we sometimes call linear functionals [covectors](http://www.euclideanspace.com/maths/algebra/vectors/related/covector/index.htm) or covariant vectors, and if we're feeling particularly loquacious, we'll refer to vectors as contravariant vectors.

This has to do with the fact that when you change basis, you change map the change over covariant vectors covariantly, and map the change over vectors contravariantly. (This distinction is beautifully captured by [Einstein's summation notation](http://en.wikipedia.org/wiki/Einstein_notation).)

We also have a notion of [covariance and contravariance in computer science](http://en.wikipedia.org/wiki/Covariance_and_contravariance_\(computer_science\))!

Functions vary covariantly in their result, and contravariant in their argument. `E -> R` is contravariant in E. But we chose this representation for our free modules, so the vectors in our free vector space (or module) are contravariant in E.

```haskell
class Contravariant f where
  contramap :: (a -> b) -> f a -> f b

-- | Dual function arrows.
newtype Op a b = Op { getOp :: b -> a }

instance Contravariant (Op a) where
  contramap f g = Op (getOp g . f)
```

On the other hand `(E -> R) ~> R` varies covariantly with the change of `E`.

as witnessed by the fact that it is a `Functor`.

```haskell
instance Functor (Linear r) where
  fmap f m = Linear $ \k -> m $* k . f
```

We have lots of classes for manipulating covariant structures, and most of them apply to both (Linear r) and (Map r b).

## Other Representations and Design Trade-offs

One common representation of vectors in a free vector space is as some kind of normalized list of scalars and basis vectors. In particular, David Amos's wonderful [HaskellForMaths](http://www.polyomino.f2s.com/david/haskell/main.html) uses

```haskell
newtype Vect r a = Vect { runVect :: [(r,a)] }
```

for free vector spaces, only considering them up to linearity, paying for normalization as it goes.

Given the insight above we can see that Vect isn't a representation of vectors in the free vector space, but instead represents the covectors of that space, quite simply because Vect r a varies covariantly with change of basis!

Now the price of using the `Monad` on `Vect r` is that the monad denormalizes the representation. In particular, you can have multiple copies of the same basis vector., so any function that uses `Vect r a` has to merge them together.

On the other hand with the directly encoded linear functionals we've described here, we've placed no obligations on the consumer of a linear functional. They can feed the directly encoded linear functional **any vector** they want!

In fact, it'll even be quite a bit more efficient to compute,

To see this, just consider:

```haskell
instance MultiplicativeMonoid r => Monad (Vect r) where
   return a = Vect [(1,a)]
   Vect as >>= f = Vect
       [ (p*q, b) | (p,a) < - as, (q,b) <- runVect (f b) ]
```

Every >>= must pay for multiplication. Every return will multiply the element by one. On the other hand, the price of return and bind in Linear r is function application.

```haskell
instance Monad (Linear r) where
  return a = Linear $ \k -> k a
  m >>= f = Linear $ \k -> m $* \a -> f a $* k
```

## A Digression on Free Linear Functionals

To wax categorical for a moment, we can construct a forgetful functor `U : Vect_F -> Set` that takes a vector space over F to just its set of covectors.

```haskell
F E = (E -> F, F,\f g x -> f x + g x ,\r f x -> r * f x)
```

using the pointwise constructions we built earlier.

Then in a classical setting, you can show that F is left adjoint to U.

In particular the witnesses of this adjunction provide the linear map from (E -> F) to V and the function E -> (V ~> F) giving a linear functional on V for each element of E.

In a classical setting you can go a lot farther, and show that all vector spaces (but not all modules) are free.

But in a constructive setting, such as Haskell, we need a fair bit to go back and forth, in particular we wind up need E to be finitely enumerable to go one way, and for it to have decidable equality to go in the other. The latter is fairly easy to see, because even going from `E -> (E -> F)` requires that we can define and partially apply something like [Kronecker's delta](http://en.wikipedia.org/wiki/Kronecker_delta):

```haskell
delta :: (Rig r, Eq a) => e -> e -> r
delta i j | i == j = one
       | otherwise = zero
```

## The Price of Power

The price we pay is that, given a `Rig`, we can go from `Vect r a` to `Linear r a` but going back requires `a` to be be finitely enumerable (or for our functional to satisfy other exotic side-conditions).

```haskell
vectMap :: Rig r => Vect r a -> Linear r a
vectMap (Vect as) = Map $ \k -> sum [ r * k a | (r, a) < - as ]
```

You can still probe `Linear r a` for individual coefficients, or pass it a vector for polynomial evaluation very easily, but for instance determining a degree of a polynomial efficiently requires attaching more structure to your semiring, because the only value you can get out of `Linear r a` is an `r`.

## Optimizing Linear Functionals

In both the `Vect r` and `Linear r` cases, excessive use of `(>>=)` without somehow normalizing or tabulating your data will cause a **lot** of repeated work.

This is perhaps easiest to see from the fact that `Vect r` never used the addition of `r`, so it distributed everything into a kind of disjunctive normal form. `Linear r` does the same thing.

If you look at the Kleisli arrows of `Vect r` or `Linear r` as linear mappings, then you can see that Kleisli composition is going to explode the number of terms.

So how can we collapse back down?

In the `Kleisli (Vect r)` case we usually build up a map as we walk through the list then spit the list back out in order having added up like terms.

In the `Map r` case, we can do better. My [`representable-tries`](http://hackage.haskell.org/package/representable-tries) package provides a readily instantiable `HasTrie` class, and the method:

```haskell
memo :: HasTrie a => (a -> r) -> a -> r
```

which is responsible for providing a memoized version of the function from `a -> r` in a purely functional way. This is obviously a linear map!

```haskell
memoMap :: HasTrie a => Map r a a
memoMap = Map memo
```

We can also flip memo around and memoize linear functionals.

```haskell
memoLinear :: HasTrie a => a -> Linear r a
memoLinear = Linear . flip memo
```

Next time, (co)associative (co)algebras and the myriad means of multiplying (co)vectors!
