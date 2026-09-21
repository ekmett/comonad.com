[Last time](http://comonad.com/reader/2011/free-monads-for-less-2/), I said that I was going to put our cheap new free monad to work, so let's give it a shot.

## Yield for Less

Last month at [TPDC 2011](http://www.pps.jussieu.fr/~saurin/tpdc2011/), Roshan James and Amr Sabry presented [Yield: Mainstream Delimited Continuations](http://parametricity.net/dropbox/yield.subc.pdf).

Without calling it such they worked with the free monad of the indexed store comonad. Ignoring the comonad, and just looking at the functor we can see that

```haskell
data Store i o r = Store (i -> r) o
    deriving (Functor)
```

admits the operation

```haskell
class Functor y => Yieldable y i o | y -> i o where
   yield :: o -> y i

instance Yieldable (Store i o) i o where
   yield = Store id
```

The free monad of `Store i o` is a nice model for asymmetric coroutines.

```haskell
type Yield i o = Free (Store i o)

liftFree :: Functor f => f a -> Free f a
liftFree = Free . fmap Pure

instance Yieldable y i o => Yieldable (Free y) i o where
   yield = liftFree . yield
```

With its `Monad`, you can write computations like:

```haskell
foo :: Num o => Yield () o ()
foo = do
   yield 1
   yield 2
   yield 3
```

or to streamline one of James and Sabry's examples

```haskell
walk :: Traversable f => f o -> Yield i o (f i)
walk = traverse yield
```

is an asymmetric coroutine that yields each of the elements in a traversable container in turn, replacing them with the responses from whatever is driving the coroutine.

James and Sabry called this the naive frame grabbing implementation. It is inefficient for the same reasons that we discussed before about retraversing the common trunk in free monads in general. Note that the unchanging trunk here isn't the data structure that we're traversing, but instead the chain of `Store i o` actions we took to get to the current instruction.

James and Sabry then proceeded to optimize it by hitting it with [Codensity](http://hackage.haskell.org/packages/archive/kan-extensions/0.5.0/doc/html/Control-Monad-Codensity.html).

```haskell
type Iterator i o = Codensity (Yield i o)

instance (Monad y, Yieldable y i o) => Yieldable (Codensity y) i o where
   yield = liftCodensity . yield
```

But we've now seen that we can get away with something smaller and get the same benefits.

```haskell
liftF :: Functor f => f a -> F f a
liftF f = F (\kp kf -> kf (fmap kp f))

instance Yieldable y i o => Yieldable (F y) i o where
   yield = liftF . yield
```

Flattened, and with the store untupled the new optimized representation looks like:

```haskell
newtype Iterator i o a = Iterator
  { runIterator ::
    forall r. (a -> r) -> (o -> (i -> r) -> r) -> r)
  }
```

and provides the same performance improvements for asymmetric coroutines as the `Codensity` version, used by James and Sabry, which would flatten to the much larger and less satisfying:

```haskell
newtype RSIterator i o a = RSIterator
    { runRSIterator :: forall r.
          (a -> (o -> (i -> r) -> r) -> r)
             -> (o -> (i -> r) -> r) -> r
    }
```

They proceed to give an encoding of delimited continuations into this type and vice versa, but the rest of their material is of no further use to us here.

As an aside the performance benefits of encoding Oleg's [iteratees](http://okmij.org/ftp/Streams.html) in [continuation passing style](http://hackage.haskell.org/packages/archive/iteratee/0.8.5.0/doc/html/Data-Iteratee-Base.html) arise for much the same reason. The resuting encoding is a right Kan extension!

## Who Needs the RealWorld?

As [Runar recently tweeted](http://twitter.com/#!/runarorama/status/83570792704638976), we have put this to good use here at [ClariFI](https://www.capitaliq.com/home/what-we-offer/how-you-can-get-it/clarifi.aspx). (**Yes**, we are hiring! If the contents of my blog make sense to you then [email me](mailto:ekmett@gmail.com) and let's talk.)

At ClariFI have a strongly typed functional language that bears a strong resemblance to Haskell with [rank-n types](http://www.haskell.org/haskellwiki/Rank-N_types) and a number of other interesting type system features that are particularly suited to our problem domain.

However, as with Haskell, we needed a story for how to deal with `IO`.

Now, [GHC](http://www.haskell.org/ghc/) models [IO](http://www.haskell.org/ghc/docs/6.2/html/libraries/base/GHC.IOBase.html) with the type

```haskell
newtype IO a =
   IO (State# RealWorld -> (# a, State# RealWorld #))
```

where they model `IO` by working in a strict state monad, passing around a real world that they promise not to mutate or copy. (In practice, the world is passed around as a 0-byte token.

This is somewhat problematic semantically, for a number of reasons.

First, There is always the risk of copying it or plumbing it through backwards, so we carefully hide the `State# RealWorld` from the end user. So this model really wants some notion of uniqueness or linear typing to render it perfectly safe. Heck, the entire [Clean](http://en.wikipedia.org/wiki/Clean_\(programming_language\)) language arose from just trying to address this concern.

Second, you don't **really** get to pass the real world around! We have multiple cores working these days. Stuff is happening in the back end, and as much as you might want it to be, your program isn't responsible for everything that happens in the `RealWorld`!.

Third, if in some sense all bottoms are the same, then `forever (putStrLn "Hello World")` and `undefined` are the same in that sense, despite the slew of side-effects that arise from the first one. Now, in Haskell you are allowed to catch some bottoms in the IO monad, and thereby escape from certain doom, but it is still a reasonable objection.

One alternate model for talking about `IO` is to view it as a free monad of some set of operations. This approach was taken by Wouter Swierstra's Functional Pearl: [Data Types a la Carte](http://www.cs.nott.ac.uk/~wss/Publications/DataTypesALaCarte.pdf).

You can then supply some sort of external interpreter that pumps that tree structure, performing the individual actions.

This is unsatisfying because of two things:

First, the performance is abysmal using the common ADT encoding of a free monad. Janis Voigtländer of course showed, that this can be rectified by using the `Codensity` monad.

Second, the set of `FFI` operations is closed.

What we've done instead is to define our primitive `IO` actions externally as some `FFI` type:

```haskell
type FFI o i -- external, side-effecting computation taking o, returning i
```

In practice, these are obtained by reflection by our `foreign import` statements since we run in the JVM.

Then we looked at the free monad of

```haskell
newtype OI a = forall o i. OI (FFI o i) o (i -> a) deriving Functor
```

where `OI` is the indexed store comonad used as the building block above, yielding arguments to `FFI` of type *o*, and representing a computation that would resume with a value of type *i* to obtain a result of type *a*.

In some sense this yields a more useful notion than Richard Kieburtz's novel, but largely unimplementable, `OI` comonad from [Codata and Comonads in Haskell](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.45.4741&rep=rep1&type=ps).

Flattening `Free OI` would yield the naive

```haskell
-- data FIO a where
--    Return :: a -> FIO a
--    FIO :: FFI o i -> o -> (i -> FIO a) -> FIO a
```

which would be interpreted by the runtime system.

But once we've converted to our Church-encoded Free monad and flattened we obtain:

```haskell
newtype IO a = IO
    (forall r. (a -> r) ->
                 (forall i o. FFI o i -> o -> (i -> r) -> r) ->
                 r)
```

with the `Functor` and `Monad` instances defined above.

This then gives us a number of choices on how we implement the runtime system:

We can use the machinery described earlier to convert from `IO a` to `Free OI a` or `FIO a`, and then have the runtime system pattern match on that structure on our main method, taking the `FFI` actions and their arguments and passing the results in to the language, or we can invert control, and implement things more directly by just defining

```haskell
FFI = (->)
```

while letting the `FFI`'d methods have side-effects, and then defining

```haskell
unsafePerformIO :: IO a -> a
unsafePerformIO (IO m) = m id (\ oi o ir -> ir (oi o))
```

But regardless of how `FFI` is implemented, this model provides a clear structural difference between `forever (putStrLn "Hello")` and `undefined` and does not require us to believe the pleasant fiction that we can get our hands on the real world and pass it around.

Our actual `IO` representation is only slightly more complicated than the one presented here in order to deal with the plumbing of an extra continuation to deal with Java exceptions, but the substance of this approach isn't changed by this addition.

\[Edit: incorporated a minor typographical fix into Iterator from Max Bolingbroke\]  
\[Edit: fixed Store to be data, an liftM that should have been an fmap and added the missing Functor constraint that was present in my actual implementation but didn't make it to the web, and a couple of typos in the implementation of RSIterator, all noted by Clumsy.\]
