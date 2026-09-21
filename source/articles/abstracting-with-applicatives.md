Consider the humble Applicative. More than a functor, less than a monad. It gives us such lovely syntax. Who among us still prefers to write `liftM2 foo a b` when we could instead write `foo <$> a <*> b`? But we seldom use the Applicative as such — when Functor is too little, Monad is too much, but a lax monoidal functor is just right. I noticed lately a spate of proper uses of Applicative —[Formlets](http://groups.inf.ed.ac.uk/links/formlets/) (and their later incarnation in the [reform](http://hackage.haskell.org/package/reform) library), [OptParse-Applicative](http://hackage.haskell.org/package/optparse-applicative) (and its competitor library [CmdTheLine](http://comonad.com/reader/2012/abstracting-with-applicatives/)), and a [post by Gergo Erdi](http://gergo.erdi.hu/blog/2012-12-01-static_analysis_with_applicatives/) on applicatives for declaring dependencies of computations. I also ran into a very similar genuine use for applicatives in working on the Panels library (part of [jmacro-rpc](http://hackage.haskell.org/package/jmacro-rpc)), where I wanted to determine dependencies of a dynamically generated dataflow computation. And then, again, I stumbled into an applicative while cooking up a form validation library, which turned out to be a reinvention of the same ideas as formlets.

Given all this, It seems post on thinking with applicatives is in order, showing how to build them up and reason about them. One nice thing about the approach we'll be taking is that it uses a "final" encoding of applicatives, rather than building up and then later interpreting a structure. This is in fact how we typically write monads (pace operational, free, etc.), but since we more often only determine our data structures are applicative after the fact, we often get some extra junk lying around (OptParse-Applicative, for example, has a GADT that I think is entirely extraneous).

So the usual throat clearing:

```haskell
{-# LANGUAGE TypeOperators, MultiParamTypeClasses, FlexibleInstances,
StandaloneDeriving, FlexibleContexts, UndecidableInstances,
GADTs, KindSignatures, RankNTypes #-}

module Main where
import Control.Applicative hiding (Const)
import Data.Monoid hiding (Sum, Product)
import Control.Monad.Identity
instance Show a => Show (Identity a) where
    show (Identity x) = "(Identity " ++ show x ++ ")"
```

And now, let's start with a classic applicative, going back to the [Applicative Programming With Effects](http://www.soi.city.ac.uk/~ross/papers/Applicative.pdf) paper:

```haskell
data Const mo a = Const mo deriving Show

instance Functor (Const mo) where
    fmap _ (Const mo) = Const mo

instance Monoid mo => Applicative (Const mo) where
    pure _ = Const mempty
    (Const f) < *> (Const x) = Const (f <> x)
```

(`Const` lives in [transformers](http://hackage.haskell.org/package/transformers) as the `Constant` functor, or in base as `Const`)

Note that `Const` is not a monad. We've defined it so that its structure is independent of the \`a\` type. Hence if we try to write `(>>=)` of type `Const mo a -> (a -> Const mo b) -> Const mo b`, we'll have no way to "get out" the first \`a\` and feed it to our second argument.

One great thing about Applicatives is that there is no distinction between applicative transformers and applicatives themselves. This is to say that the composition of two applicatives is cleanly and naturally always also an applicative. We can capture this like so:

```haskell
newtype Compose f g a = Compose (f (g a)) deriving Show

instance (Functor f, Functor g) => Functor (Compose f g) where
    fmap f (Compose x) = Compose $ (fmap . fmap) f x

instance (Applicative f, Applicative g) => Applicative (Compose f g) where
    pure = Compose . pure . pure
    (Compose f) < *> (Compose x) = Compose $ (< *>) < $> f < *> x
```

(`Compose` also lives in transformers)

Note that Applicatives compose **two** ways. We can also write:

```haskell
data Product f g a = Product (f a) (g a) deriving Show

instance (Functor f, Functor g) => Functor (Product f g) where
    fmap f (Product  x y) = Product (fmap f x) (fmap f y)

instance (Applicative f, Applicative g) => Applicative (Product f g) where
    pure x = Product (pure x) (pure x)
    (Product f g) < *> (Product  x y) = Product (f < *> x) (g < *> y)
```

(`Product` lives in transformers as well)

This lets us now construct an extremely rich set of applicative structures from humble beginnings. For example, we can reconstruct the Writer Applicative.

```haskell
type Writer mo = Product (Const mo) Identity

tell :: mo -> Writer mo ()
tell x = Product (Const x) (pure ())
```

```haskell
-- tell [1] *> tell [2]
-- > Product (Const [1,2]) (Identity ())
```

Note that if we strip away the newtype noise, Writer turns into `(mo,a)` which is isomorphic to the Writer monad. However, we've learned something along the way, which is that the monoidal component of Writer (as long as we stay within the rules of applicative) is entirely independent from the "identity" component. However, if we went on to write the Monad instance for our writer (by defining `>>=`), we'd have to "reach in" to the identity component to grab a value to hand back to the function yielding our monoidal component. Which is to say we would destroy this nice seperation of "trace" and "computational content" afforded by simply taking the product of two Applicatives.

Now let's make things more interesting. It turns out that just as the composition of two applicatives may be a monad, so too the composition of two monads may be no stronger than an applicative!

We'll see this by introducing Maybe into the picture, for possibly failing computations.

```haskell
type FailingWriter mo = Compose (Writer mo) Maybe

tellFW :: Monoid mo => mo -> FailingWriter mo ()
tellFW x = Compose (tell x *> pure (Just ()))

failFW :: Monoid mo => FailingWriter mo a
failFW = Compose (pure Nothing)
```

```haskell
-- tellFW [1] *> tellFW [2]
-- > Compose (Product (Const [1,2]) (Identity Just ()))

-- tellFW [1] *> failFW *> tellFW [2]
-- > Compose (Product (Const [1,2]) (Identity Nothing))
```

Maybe over Writer gives us the same effects we'd get in a Monad — either the entire computation fails, or we get the result and the trace. But Writer over Maybe gives us new behavior. We get the entire trace, even if some computations have failed! This structure, just like Const, cannot be given a proper Monad instance. (In fact if we take Writer over Maybe as a Monad, we get only the trace until the first point of failure).

This seperation of a monoidal trace from computational effects (either entirely independent of a computation \[via a product\] or independent between parts of a computation \[via Compose\]) is the key to lots of neat tricks with applicative functors.

Next, let's look at Gergo Erdi's "Static Analysis with Applicatives" that is built using free applicatives. We can get essentially the same behavior directly from the product of a constant monad with an arbitrary effectful monad representing our ambient environment of information. As long as we constrain ourselves to only querying it with the takeEnv function, then we can either read the left side of our product to statically read dependencies, or the right side to actually utilize them.

```haskell
type HasEnv k m = Product (Const [k]) m
takeEnv :: (k -> m a) -> k -> HasEnv k m a
takeEnv f x = Product (Const [x]) (f x)
```

If we prefer, we can capture queries of a static environment directly with the standard Reader applicative, which is just a newtype over the function arrow. There are other varients of this that perhaps come closer to exactly how Erdi's post does things, but I think this is enough to demonstrate the general idea.

```haskell
data Reader r a = Reader (r -> a)
instance Functor (Reader r) where
    fmap f (Reader x) = Reader (f . x)
instance Applicative (Reader r) where
    pure x = Reader $ pure x
    (Reader f) < *> (Reader x) = Reader (f < *> x)

runReader :: (Reader r a) -> r -> a
runReader (Reader f) = f

takeEnvNew :: (env -> k -> a) -> k -> HasEnv k (Reader env) a
takeEnvNew f x = Product (Const [x]) (Reader $ flip f x)
```

So, what then is a full formlet? It's something that can be executed in one context as a monoid that builds a form, and in another as a parser. so the top level must be a product.

```haskell
type FormletOne mo a = Product (Const mo) Identity a
```

Below the product, we read from an environment and perhaps get an answer. So that's reader with a maybe.

```haskell
type FormletTwo mo env a =
    Product (Const mo) (Compose (Reader env) Maybe) a
```

Now if we fail, we want to have a trace of errors. So we expand out the Maybe into a product as well to get the following, which adds monoidal errors:

```haskell
type FormletThree mo err env a =
    Product (Const mo)
            (Compose (Reader env) (Product (Const err) Maybe)) a
```

But now we get errors whether or not the parse succeeds. We want to say either the parse succeeds or we get errors. For this, we can turn to the typical Sum functor, which currently lives as Coproduct in comonad-transformers, but will hopefully be moving as Sum to the transformers library in short order.

```haskell
data Sum f g a = InL (f a) | InR (g a) deriving Show

instance (Functor f, Functor g) => Functor (Sum f g) where
    fmap f (InL x) = InL (fmap f x)
    fmap f (InR y) = InR (fmap f y)
```

The Functor instance is straightforward for Sum, but the applicative instance is puzzling. What should "pure" do? It needs to inject into either the left or the right, so clearly we need some form of "bias" in the instance. What we really need is the capacity to "work in" one side of the sum until compelled to switch over to the other, at which point we're stuck there. If two functors, F and G are in a relationship such that we can always send `f x -> g x` in a way that "respects" fmap (that is to say, such that (`fmap f . fToG == ftoG . fmap f`) then we call this a natural transformation. The action that sends f to g is typically called "eta". (We actually want something slightly stronger called a "monoidal natural transformation" that respects not only the functorial action `fmap` but the applicative action `<*>`, but we can ignore that for now).

Now we can assert that as long as there is a natural transformation between g and f, then Sum f g can be made an Applicative, like so:

```haskell
class Natural f g where
    eta :: f a -> g a

instance (Applicative f, Applicative g, Natural g f) =>
  Applicative (Sum f g) where
    pure x = InR $ pure x
    (InL f) < *> (InL x) = InL (f < *> x)
    (InR g) < *> (InR y) = InR (g < *> y)
    (InL f) < *> (InR x) = InL (f < *> eta x)
    (InR g) < *> (InL x) = InL (eta g < *> x)
```

The natural transformation we'll tend to use simply sends any functor to Const.

```haskell
instance Monoid mo => Natural f (Const mo) where
    eta = const (Const mempty)
```

However, there are plenty of other natural transformations that we could potentially make use of, like so:

```haskell
instance Applicative f =>
  Natural g (Compose f g) where
     eta = Compose . pure

instance (Applicative g, Functor f) => Natural f (Compose f g) where
     eta = Compose . fmap pure

instance (Natural f g) => Natural f (Product f g) where
    eta x = Product x (eta x)

instance (Natural g f) => Natural g (Product f g) where
    eta x = Product (eta x) x

instance Natural (Product f g) f where
    eta (Product x _ ) = x

instance Natural (Product f g) g where
    eta (Product _ x) = x

instance Natural g f => Natural (Sum f g) f where
    eta (InL x) = x
    eta (InR y) = eta y

instance Natural Identity (Reader r) where
    eta (Identity x) = pure x
```

In theory, there should also be a natural transformation that can be built magically from the product of any other two natural transformations, but that will just confuse the Haskell typechecker hopelessly. This is because we know that often different "paths" of typeclass choices will often be isomorphic, but the compiler has to actually pick one "canonical" composition of natural transformations to compute with, although multiple paths will typically be possible.

For similar reasons of avoiding overlap, we can't both have the terminal homomorphism that sends everything to "Const" **and** the initial homomorphism that sends "Identity" to anything like so:

```haskell
-- instance Applicative g => Natural Identity g where
--     eta (Identity x) = pure x
```

We choose to keep the terminal transformation around because it is more generally useful for our purposes. As the comments below point out, it turns out that a version of "Sum" with the initial transformation baked in now lives in transformers as `Lift`.

In any case we can now write a proper Validation applicative:

```haskell
type Validation mo = Sum (Const mo) Identity

validationError :: Monoid mo => mo -> Validation mo a
validationError x = InL (Const x)
```

This applicative will yield either a single result, or an accumulation of monoidal errors. It exists on hackage in the [Validation](http://hackage.haskell.org/package/Validation) package.

Now, based on the same principles, we can produce a full Formlet.

```haskell
type Formlet mo err env a =
    Product (Const mo)
            (Compose (Reader env)
                     (Sum (Const err) Identity))
    a
```

All the type and newtype noise looks a bit ugly, I'll grant. But the idea is to **think** with structures built with applicatives, which gives guarantees that we're building applicative structures, and furthermore, structures with certain guarantees in terms of which components can be interpreted independently of which others. So, for example, we can strip away the newtype noise and find the following:

```haskell
type FormletClean mo err env a = (mo, env -> Either err a)
```

Because we built this up from our basic library of applicatives, we also know how to write its applicative instance directly.

Now that we've gotten a basic algebraic vocabulary of applicatives, and especially now that we've produced this nifty Sum applicative (which I haven't seen presented before), we've gotten to where I intended to stop.

But lots of other questions arise, on two axes. First, what other typeclasses beyond applicative do our constructions satisfy? Second, what basic pieces of vocabulary are missing from our constructions — what do we need to add to flesh out our universe of discourse? (Fixpoints come to mind).

Also, what statements can we make about "completeness" — what portion of the space of all applicatives can we enumerate and construct in this way? Finally, why is it that monoids seem to crop up so much in the course of working with Applicatives? I plan to tackle at least some of these questions in future blog posts.
