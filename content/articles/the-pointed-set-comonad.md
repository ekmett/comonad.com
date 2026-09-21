Last night, Chung-Chieh Shan posted an example of a [pointed-set monad](http://conway.rutgers.edu/~ccshan/wiki/blog/posts/Pointed_set/) on his blog, which happens to be isomorphic to a non-empty stream monad with a different emphasis.

But, I thought I should point out that the pointed set that he posted also has a comonadic structure, which may be exploited since it is just a variation on the "zipper comonad," a structure that is perhaps more correctly called a "pointing comonad."

But first, a little background:

With [combinatorial species](http://en.wikipedia.org/wiki/Combinatorial_species) you point a data structure by marking a single element in it as special. We can represent that with the product of an element and the [derivative](http://en.wikipedia.org/wiki/Derivative_\(generalizations\)#Set_theory_and_logic) of the original type.

```haskell
F*[A] = A * F'[A]
```

So, then looking at Shan's pointed set, we can ask what combinatorial species has a list as its derivative?

The answer is a cycle, not a set.

This fact doesn't matter to the monad, since the only way a monadic action interacts with that extra structure is safely through bind, but does for the comonad where every comonadic action has access to that structure, but no control over the shape of the result.

However, we don't really have a way to represent an unordered set in Haskell, so if you are treating a list as a set, the derivative of a set is another set then we can also view the a \* \[a\] as a pointed set, so long as we don't depend on the order of the elements in the list in any way in obtaining the result of our comonadic actions.

I've changed the name of his data type to `PointedSet` to avoid conflicting with the definitions of `Pointed` and `Copointed` functors in category extras.

```haskell
module PointedSet where

import Control.Comonad -- from my category-extras library
import Data.List (inits,tails) -- used much later below

data PointedSet a = PointedSet a [a] deriving (Eq, Ord, Show, Read)

instance Functor PointedSet where
    fmap f (PointedSet x xs) = PointedSet (f x) $ fmap f xs
```

The definition for extract is obvious, since you have already selected a point, just return it.

```haskell
instance Copointed PointedSet where
    extract (PointedSet x _) = x
```

On the other hand, for duplicate we have a couple of options. An obvious and correct, but boring implementation transforms a value as follows:

```haskell
boring_duplicate :: PointedSet a -> PointedSet (PointedSet a)
boring_duplicate xxs@(PointedSet x xs) =
    PointedSet xxs $ fmap (flip PointedSet []) xs
```

```haskell
*PointedSet> boring_duplicate $ PointedSet 0 [1..3]
PointedSet (PointedSet 0 [1..3]) [
    PointedSet 1 [],
    PointedSet 2 [],
    PointedSet 3 []
]
```

but that just abuses the fact that we can always return an empty list.

Another fairly boring interpretation is to just use the guts of the definition of the Stream comonad, but that doesn't model a set with a single memory singled out.

A more interesting version refocuses on each element of the list in turn, which makes the connection to the zipper comonad much more obvious. Since we want a pointed set and not a pointed cycle, we can focus on an element just by swapping out the element in the list in that position for the focus.

Again, since we can't specify general species in Haskell, this is as close as we can come to the correct comonadic structure for a pointed set. Due to the limitations of our type system, the comonadic action can still see the order of elements in the set, but it shouldn't use that information.

Since we don't care to preserve the order of the miscellaneous set elements, the `refocus` helper function below can just accumulate preceding elements in an accumulating parameter in reverse order.

```haskell
instance Comonad PointedSet where
    duplicate xxs@(PointedSet x xs) = PointedSet xxs $ refocus [] x xs
      where
        refocus :: [a] -> a -> [a] -> [PointedSet a]
        refocus acc x (y:ys) =
            PointedSet y (acc ++ (x:ys)) : refocus (y:acc) x ys
        refocus acc x [] = []
```

Now,

```haskell
*PointedSet> duplicate $ PointedSet 0 [1..3] =
PointedSet (PointedSet 0 [1,2,3]) [
    PointedSet 1 [0,2,3],
    PointedSet 2 [1,0,3],
    PointedSet 3 [2,1,0]
]
```

With that in hand we can define comonadic actions that can look at an entire `PointedSet` and return a value, then extend them comonadically to generate new pointed sets.

For instance, if we had a numerical pointed set and wanted to blur our focus somewhat we could weight an average between the focused and unfocused elements:

```haskell
smooth :: Fractional a => a -> PointedSet a -> a
smooth w (PointedSet a as) =
    w * a +
    (1 - w) * sum as / fromIntegral (length as)
```

Smoothing is a safe pointed-set comonadic operation because it doesn't care about the order of the elements in the list.

And so now we can blur the distinction between the focused element and the rest of the set:

```haskell
*PointedSet> extend (smooth 0.5) $ PointedSet 10 [1..5]
PointedSet 6.5 [2.9,3.3,3.7,4.1,4.5]
```

A quick pass over the comonad laws shows that they all check out.

As noted above, if your comonadic action uses the order of the elements in the list beyond the selection of the focus, then it isn't really a valid pointed set comonadic operation. This is because we are abusing a list to approximate a (multi)set.

## The Pointed-Cycle Comonad

A slight variation on this theme keeps the order of the elements the same in exchange for a more expensive refocusing operation and just rotates them through the focus.

```haskell
data PointedCycle a = PointedCycle a [a] deriving (Eq, Ord, Show,Read)

instance Functor PointedCycle where
    fmap f (PointedCycle x xs) = PointedCycle (f x) $ fmap f xs

instance Copointed PointedCycle where
    extract (PointedCycle x _) = x

instance Comonad PointedCycle where
   duplicate xxs@(PointedCycle x xs) =
        PointedCycle xxs . fmap listToCycle . tail $ rotations (x:xs)
     where
        rotations :: [a] -> [[a]]
        rotations xs = init $ zipWith (++) (tails xs) (inits xs)
        listToCycle (x:xs) = PointedCycle x xs
```

With that you acknowledge that you really have a pointed cycle and the writer of the comonadic action can safely use the ordering information intrinsic to the list as a natural consequence of having taken the derivative of a cycle.

```haskell
*PointedSet> duplicate $ PointedCycle 0 [1..3]
PointedCycle (PointedCycle 0 [1,2,3]) [
    PointedCycle 1 [2,3,0],
    PointedCycle 2 [3,0,1],
    PointedCycle 3 [0,1,2]
]
```
