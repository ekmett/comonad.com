The post below will only compile on a version of GHC >= 6.9, since it uses type families.

There has been a lot of posting recently about automatic differentiation in Haskell, and I wanted to try the same thing with functors in the spirit of Conor McBride's [Clowns to the Left of me, Jokers to the Right](http://strictlypositive.org/CJ.pdf) and [The derivative of a regular type is its type of one hole contexts](http://citeseer.ist.psu.edu/472190.html), figuring that a Power Series could fully generalize Christophe Poucet's [Higher Order Zippers](http://notvincenz.blogspot.com/2007/07/higher-order-zippers.html), and might provide me with a neat extension to the zipper comonadic automata I've been aluding to recently.

```haskell
{-# OPTIONS -fglasgow-exts -fallow-undecidable-instances -fallow-overlapping-instances #-}
module Derivatives where
import Control.Monad.Identity
import Control.Arrow ((+++),(***),(&&&))
import Data.Monoid
infixl 9 :.:
infixl 7 :*:
infixl 6 :+:
```

To avoid importing [category-extras](http://hackage.haskell.org/cgi-bin/hackage-scripts/package/category-extras-0.44.4) and keep this post self-contained (modulo GHC 6.9!), we'll define some preliminaries such as Bifunctors:

```haskell
class Bifunctor f where
  bimap :: (a -> c) -> (b -> d) -> f a b -> f c d

instance Bifunctor (,) where
  bimap f g ~(a,b) = (f a, g b)

instance Bifunctor Either where
  bimap f _ (Left a) = Left (f a)
  bimap _ g (Right b) = Right (g b)
```

Constant functors:

```haskell
data Void
instance Show Void where show _ = "Void"
newtype Const k a = Const { runConst :: k } deriving (Show)
type Zero = Const Void
type One = Const ()
instance Functor (Const k) where
  fmap f = Const . runConst
```

and functor products and coproducts:

```haskell
newtype Lift p f g a = Lift { runLift ::  p (f a) (g a) }
type (:+:) = Lift Either
type (:*:) = Lift (,)
instance Show (p (f a) (g a)) => Show (Lift p f g a) where
  show (Lift x) = "(Lift (" ++ show x ++ "))"
instance (Bifunctor p, Functor f, Functor g) => Functor (Lift p f g) where
  fmap f = Lift . bimap (fmap f) (fmap f) . runLift
```

and finally functor composition

```haskell
newtype (f :.: g) a = Comp { runComp :: f (g a) } deriving (Show)
instance (Functor f, Functor g) => Functor (f :.: g) where
  fmap f = Comp . fmap (fmap f) . runComp
```

So then, an ideal type for repeated differentiation would look something like the following, for some definition of D.

\[Edit: sigfpe pointed out, quite rightly, that this is just repeated differentiation, and apfelmus pointed out that it not a power series, because I have no division!\]

```haskell
newtype AD f a  = AD { runAD :: (f a,  AD (D f) a) }
```

As a first crack at D, you might be tempted to just go with a type family:

```haskell
{-
type family D (f :: * -> *) :: * -> *
type instance D Identity = One
type instance D (Const k) = Zero
type instance D (f :+: g) = D f :+: D g
type instance D (f :*: g) = f :*: D g :+: D f :*: g
type instance D (f :.: g) = (D f :.: g) :*: D g
-}
```

This could take you pretty far, but unfortunately doesn't adequately provide you with any constraints on the type so that we can treat AD f as a functor.

So, we'll go with:

```haskell
class (Functor (D f), Functor f) => Derivable (f :: * -> *) where
  type D f :: * -> *
```

and cherry pick the instances necessary to handle the above cases:

```haskell
instance Derivable Identity where
  type D Identity = One

instance Derivable (Const k) where
  type D (Const k) = Zero

instance (Derivable f, Derivable g) => Derivable (f :+: g) where
  type D (f :+: g) = D f :+: D g

instance (Derivable f, Derivable g) => Derivable (f :*: g) where
  type D (f :*: g) = f :*: D g :+: D f :*: g

instance (Derivable f, Derivable g) => Derivable (f :.: g) where
  type D (f :.: g) = (D f :.: g) :*: D g
```

With those instances in hand, we can define the definition of a Functor for the automatic differentiation of a Functor built out of these primitives:

```haskell
instance (Derivable f, Functor (AD (D f))) => Functor (AD f) where
  fmap f = Power . bimap (fmap f) (fmap f) . runPower
```

Unfortunately, here is where I run out of steam, because any attempt to actually use the construct in question blows the context stack because the recursion for Functor (AD f) isn't well founded and my attempts to force it to be so through overlapping-instances have thus-far failed.

Thoughts?

\[[Source Code](http://comonad.com/haskell/Derivatives.hs)\]
