You may recall the definition for an exponential functor from my previous entry, which can also be viewed, I suppose, as functors in the  
category of right-invertible functions in Haskell.

```haskell
class ExpFunctor f where
  xmap :: (a -> b) -> (b -> a) -> f a -> f b
```

Clarifying the above, an instance of ExpFunctor should satisfy the slightly generalized version of the Functor laws from Control.Monad:

```haskell
xmap id id = id
xmap f g . xmap f' g' = xmap (f . f') (g' . g)
```

Since we like to apply xmap to a pair of functions such that f . g = id, as in the Fegaras/Sheard case, we get:

```haskell
xmap f g . xmap g f
  = xmap (f . g) (f . g) -- by second xmap law
  = xmap id id                -- by f . g = id
  = id                       -- by first xmap law
```

In any event, what I thought what I'd do today is note that Wouter Swierstra's [Data Types a la Carte](http://www.cs.nott.ac.uk/~wss/Publications/DataTypesALaCarte.pdf) approach works over exponential functors.

Swierstra's main definition looks something like:

```haskell
data (f :+: g) e = Inl (f e) | Inr (g e)

instance (Functor f, Functor g) => Functor (f :+: g) where
  fmap f (Inl e) = Inl (fmap f e)
  fmap f (Inr e) = Inr (fmap f e)
```

This permits the obvious analogue:

```haskell
instance (ExpFunctor f, ExpFunctor g) => ExpFunctor (f :+: g) where
  xmap f g (Inl e) = Inl (xmap f g e)
  xmap f g (Inr e) = Inr (xmap f g e)
```

With this we can quickly encode the untyped lambda calculus:

```haskell
newtype Lam a = Lam (a -> a)
instance ExpFunctor Lam where
  xmap f g (Lam k) = Lam (f . k . g)

data App a = App a a
instance Functor App where
  fmap f (App a b) = App (f a) (f b)
instance ExpFunctor App where
  xmap = const . fmap
```

(Even better we could define a generic Bind and Binary functors, and newtype to get Lam and App)

and we can encode the recursion using any of the ways we previously established to tie the knot (Nu f, ForAll (Rec f), ForAll (Elim f)).

The rest of the a la carte stuff remains unchanged.

We then get a definition of catamorphism 'for free', due to the definitions from the other day.

From there we can define a fairly generic pretty printing framework.

```haskell
class ShowAlgebra f where
    showAlgebra :: f ([String] -> String) -> [String] -> String

instance (ShowAlgebra f, ShowAlgebra g) => ShowAlgebra (f :+: g) where
    showAlgebra (Inl e) = showAlgebra e
    showAlgebra (Inr e) = showAlgebra e

instance (Cata f (ForAll t), ShowAlgebra f) => Show (ForAll t) where
    show x = cata showAlgebra (runForAll x) vars
```

And then we can derive particular instances for the untyped lambda calculus we slapped together above:

```haskell
instance ShowAlgebra Lam where
    showAlgebra (Lam k) (v:vars) =
        "(\\\\" ++ v ++ ". " ++ k (const v) vars ++ ")"

instance ShowAlgebra App where
    showAlgebra (App a b) vars =
        "(" ++ a vars ++ " " ++ b vars ++ ")"
```

Then using the combinators from the other day:

```haskell
type Term a = Elim (Lam :+: App) a
type Expr = ForAll Term

app_id_id :: Term a
app_id_id = app (lam id) (lam id)
-- for suitable definitions of app and lam a la the a la Carte paper.

main = putStrLn . show $ safe app_id_id
```

Other algebra structures can be derived similarly.
