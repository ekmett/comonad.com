It is often stated that `Foldable` is effectively the `toList` class. However, this turns out to be wrong. The real fundamental member of `Foldable` is `foldMap` (which should look suspiciously like `traverse`, incidentally). To understand exactly why this is, it helps to understand another surprising fact: lists are not free monoids in Haskell.

This latter fact can be seen relatively easily by considering another list-like type:

```haskell
data SL a = Empty | SL a :> a

instance Monoid (SL a) where
  mempty = Empty
  mappend ys Empty = ys
  mappend ys (xs :> x) = (mappend ys xs) :> x

single :: a -> SL a
single x = Empty :> x
```

So, we have a type `SL a` of snoc lists, which are a monoid, and a function that embeds `a` into `SL a`. If (ordinary) lists were the free monoid, there would be a unique monoid homomorphism from lists to snoc lists. Such a homomorphism (call it `h`) would have the following properties:

```haskell
h [] = Empty
h (xs <> ys) = h xs <> h ys
h [x] = single x
```

And in fact, this (together with some general facts about Haskell functions) should be enough to define `h` for our purposes (or any purposes, really). So, let's consider its behavior on two values:

```haskell
h [1] = single 1

h [1,1..] = h ([1] <> [1,1..]) -- [1,1..] is an infinite list of 1s
    = h [1] <> h [1,1..]
```

This second equation can tell us what the value of `h` is at this infinite value, since we can consider it the definition of a possibly infinite value:

```haskell
x = h [1] <> x = fix (single 1 <>)
h [1,1..] = x
```

`(single 1 <>)` is a strict function, so the fixed point theorem tells us that `x = ⊥`.

This is a problem, though. Considering some additional equations:

```haskell
[1,1..] <> [n] = [1,1..] -- true for all n
h [1,1..] = ⊥
h ([1,1..] <> [1]) = h [1,1..] <> h [1]
       = ⊥ <> single 1
       = ⊥ :> 1
       ≠ ⊥
```

So, our requirements for `h` are contradictory, and no such homomorphism can exist.

The issue is that Haskell types are domains. They contain these extra partially defined values and infinite values. The monoid structure on (cons) lists has infinite lists absorbing all right-hand sides, while the snoc lists are just the opposite.

This also means that finite lists (or any method of implementing finite sequences) are not free monoids in Haskell. They, as domains, still contain the additional bottom element, and it absorbs all other elements, which is incorrect behavior for the free monoid:

```haskell
pure x <> ⊥ = ⊥
h ⊥ = ⊥
h (pure x <> ⊥) = [x] <> h ⊥
    = [x] ++ ⊥
    = x:⊥
    ≠ ⊥
```

So, what is the free monoid? In a sense, it can't be written down at all in Haskell, because we cannot enforce value-level equations, and because we don't have quotients. But, if conventions are good enough, there is a way. First, suppose we have a free monoid type `FM a`. Then for any other monoid `m` and embedding `a -> m`, there must be a monoid homomorphism from `FM a` to `m`. We can model this as a Haskell type:

```haskell
forall a m. Monoid m => (a -> m) -> FM a -> m
```

Where we consider the `Monoid m` constraint to be enforcing that `m` actually has valid monoid structure. Now, a trick is to recognize that this sort of universal property can be used to *define* types in Haskell (or, GHC at least), due to polymorphic types being first class; we just rearrange the arguments and quantifiers, and take `FM a` to be the polymorphic type:

```haskell
newtype FM a = FM { unFM :: forall m. Monoid m => (a -> m) -> m }
```

Types defined like this are automatically universal in the right sense. [\[1\]](#footnote-1) The only thing we have to check is that `FM a` is actually a monoid over `a`. But that turns out to be easily witnessed:

```haskell
embed :: a -> FM a
embed x = FM $ \k -> k x

instance Monoid (FM a) where
  mempty = FM $ \_ -> mempty
  mappend (FM e1) (FM e2) = FM $ \k -> e1 k <> e2 k
```

Demonstrating that the above is a proper monoid delegates to instances of `Monoid` being proper monoids. So as long as we trust that convention, we have a free monoid.

However, one might wonder what a free monoid would look like as something closer to a traditional data type. To construct that, first ignore the required equations, and consider only the generators; we get:

```haskell
data FMG a = None | Single a | FMG a :<> FMG a
```

Now, the proper `FM a` is the quotient of this by the equations:

```haskell
None :<> x = x = x :<> None
x :<> (y :<> z) = (x :<> y) :<> z
```

One way of mimicking this in Haskell is to hide the implementation in a module, and only allow elimination into `Monoid`s (again, using the convention that `Monoid` ensures actual monoid structure) using the function:

```haskell
unFMG :: forall a m. Monoid m => FMG a -> (a -> m) -> m
unFMG None _ = mempty
unFMG (Single x) k = k x
unFMG (x :<> y) k = unFMG x k <> unFMG y k
```

This is actually how quotients can be thought of in richer languages; the quotient does not eliminate any of the generated structure internally, it just restricts the way in which the values can be consumed. Those richer languages just allow us to prove equations, and enforce properties by proof obligations, rather than conventions and structure hiding. Also, one should note that the above should look pretty similar to our encoding of `FM a` using universal quantification earlier.

Now, one might look at the above and have some objections. For one, we'd normally think that the quotient of the above type is just `[a]`. Second, it seems like the type is revealing something about the associativity of the operations, because defining recursive values via left nesting is different from right nesting, and this difference is observable by extracting into different monoids. But aren't monoids supposed to remove associativity as a concern? For instance:

```haskell
ones1 = embed 1 <> ones1
ones2 = ones2 <> embed 1
```

Shouldn't we be able to prove these are the same, becuase of an argument like:

```haskell
ones1 = embed 1 <> (embed 1 <> ...)
      ... reassociate ...
      = (... <> embed 1) <> embed 1
      = ones2
```

The answer is that the equation we have only specifies the behavior of associating three values:

```haskell
x <> (y <> z) = (x <> y) <> z
```

And while this is sufficient to nail down the behavior of *finite* values, and *finitary* reassociating, it does not tell us that *infinitary* reassociating yields the same value back. And the "... reassociate ..." step in the argument above was decidedly infinitary. And while the rules tell us that we can peel any finite number of copies of `embed 1` to the front of `ones1` or the end of `ones2`, it does not tell us that `ones1 = ones2`. And in fact it is vital for `FM a` to have distinct values for these two things; it is what makes it the free monoid when we're dealing with domains of lazy values.

Finally, we can come back to `Foldable`. If we look at `foldMap`:

```haskell
foldMap :: (Foldable f, Monoid m) => (a -> m) -> f a -> m
```

we can rearrange things a bit, and get the type:

```haskell
Foldable f => f a -> (forall m. Monoid m => (a -> m) -> m)
```

And thus, the most fundamental operation of `Foldable` is not `toList`, but `toFreeMonoid`, and lists are not free monoids in Haskell.

<span id="footnote-1"></span>\[1\]: What we are doing here is noting that (co)limits are objects that internalize natural transformations, but the natural transformations expressible by quantification in GHC are already automatically internalized using quantifiers. However, one has to be careful that the quantifiers are actually enforcing the relevant naturality conditions. In many simple cases they are.
