A common occurrence in category theory is the [adjoint triple](https://ncatlab.org/nlab/show/adjoint+triple). This is a pair of adjunctions relating three functors:

```haskell
F ⊣ G ⊣ H
F ⊣ G, G ⊣ H
```

Perhaps part of the reason they are so common is that (co)limits form one:

```haskell
colim ⊣ Δ ⊣ lim
```

where `Δ : C -> C^J` is the diagonal functor, which takes objects in `C` to the constant functor returning that object. A version of this shows up in Haskell (with some extensions) and dependent type theories, as:

```haskell
∃ ⊣ Const ⊣ ∀
Σ ⊣ Const ⊣ Π
```

where, if we only care about quantifying over a single variable, existential and sigma types can be seen as a left adjoint to a diagonal functor that maps types into constant type families (either over `*` for the first triple in Haskell, or some other type for the second in a dependently typed language), while universal and pi types can be seen as a right adjoint to the same.

It's not uncommon to see the above information in type theory discussion forums. But, there are a few cute properties and examples of adjoint triples that I haven't really seen come up in such contexts.

To begin, we can compose the two adjunctions involved, since the common functor ensures things match up. By calculating on the hom definition, we can see:

```haskell
Hom(FGA, B)     Hom(GFA, B)
    ~=              ~=
Hom(GA, GB)     Hom(FA, HB)
    ~=              ~=
Hom(A, HGB)     Hom(A, GHB)
```

So there are two ways to compose the adjunctions, giving two induced adjunctions:

```haskell
FG ⊣ HG,  GF ⊣ GH
```

And there is something special about these adjunctions. Note that `FG` is the comonad for the `F ⊣ G` adjunction, while `HG` is the monad for the `G ⊣ H` adjunction. Similarly, `GF` is the `F ⊣ G` monad, and `GH` is the `G ⊣ H` comonad. So each adjoint triple gives rise to two adjunctions between monads and comonads.

The second of these has another interesting property. We often want to consider the algebras of a monad, and coalgebras of a comonad. The (co)algebra operations with carrier `A` have type:

```haskell
alg   : GFA -> A
coalg : A -> GHA
```

but these types are isomorphic according to the `GF ⊣ GH` adjunction. Thus, one might guess that `GF` monad algebras are also `GH` comonad coalgebras, and that in such a situation, we actually have some structure that can be characterized both ways. In fact this is true for any monad left adjoint to a comonad; [\[0\]](#note0) but all adjoint triples give rise to these.

The first adjunction actually turns out to be more familiar for the triple examples above, though. (Edit: [\[2\]](#note2)) If we consider the `Σ ⊣ Const ⊣ Π` adjunction, where:

```haskell
Σ Π : (A -> Type) -> Type
Const : Type -> (A -> Type)
```

we get:

```haskell
ΣConst : Type -> Type
ΣConst B = A × B
ΠConst : Type -> Type
ΠConst B = A -> B
```

So this is the familiar adjunction:

```haskell
A × - ⊣ A -> -
```

But, there happens to be a triple that is a bit more interesting for both cases. It refers back to categories of functors vs. bare type constructors mentioned in previous posts. So, suppose we have a category called `Con` whose objects are (partially applied) type constructors (f, g) with kind `* -> *`, and arrows are polymorphic functions with types like:

```haskell
forall x. f x -> g x
```

And let us further imagine that there is a similar category, called `Func`, except its objects are the things with `Functor` instances. Now, there is a functor:

```haskell
U : Func -> Con
```

that 'forgets' the functor instance requirement. This functor is in the middle of an adjoint triple:

```haskell
F ⊣ U ⊣ C
F, C : Con -> Func
```

where `F` creates the free functor over a type constructor, and `C` creates the cofree functor over a type constructor. These can be written using the types:

```haskell
data F f a = forall e. F (e -> a) (f e)
newtype C f a = C (forall r. (a -> r) -> f r)
```

and these types will also serve as the types involved in the composite adjunctions:

```haskell
FU ⊣ CU : Func -> Func
UF ⊣ UC : Con -> Con
```

Now, `CU` is a monad on functors, and the Yoneda lemma tells us that it is actually the identity monad. Similarly, `FU` is a comonad, and the co-Yoneda lemma tells us that it is the identity comonad (which makes sense, because identity is self-adjoint; and the above is why `F` and `C` are often named `(Co)Yoneda` in Haskell examples).

On the other hand, `UF` is a *monad* on type constructors (note, `U` isn't represented in the Haskell types; `F` and `C` just play triple duty, and the constraints on `f` control what's going on):

```haskell
eta :: f a -> F f a
eta = F id

transform :: (forall x. f x -> g x) -> F f a -> F g a
transform tr (F g x) = F g (tr x)

mu :: F (F f) a -> F f a
mu (F g (F h x)) = F (g . h) x
```

and `UC` is a *comonad*:

```haskell
epsilon :: C f a -> f a
epsilon (C e) = e id

transform' :: (forall x. f x -> g x) -> C f a -> C g a
transform' tr (C e) = C (tr . e)

delta :: C f a -> C (C f) a
delta (C e) = C $ \h -> C $ \g -> e (g . h)
```

These are not the identity (co)monad, but this is the case where we have algebras and coalgebras that are equivalent. So, what are the (co)algebras? If we consider `UF` (and unpack the definitions somewhat):

```haskell
alg :: forall e. (e -> a, f e) -> f a
alg (id, x) = x
alg (g . h, x) = alg (g, alg (h, x))
```

and for `UC`:

```haskell
coalg :: f a -> forall r. (a -> r) -> f r
coalg x id = x
coalg x (g . h) = coalg (coalg x h) g
```

in other words, (co)algebra actions of these (co)monads are (mangled) `fmap` implementations, and the commutativity requirements are exactly what is required to be a law abiding instance. So the (co)algebras are exactly the `Functors`. [\[1\]](#note1)

There are, of course, many other examples of adjoint triples. And further, there are even adjoint quadruples, which in turn give rise to adjoint triples of (co)monads. Hopefully this has sparked some folks' interest in finding and studying more interesting examples.

<span id="note0"></span>\[0\]: Another exmaple is `A × - ⊣ A -> -` where the `A` in question is a monoid. (Co)monad (co)algebras of these correspond to actions of the monoid on the carrier set.

<span id="note1"></span>\[1\]: This shouldn't be too surprising, because having a category of (co)algebraic structures that is equivalent to the category of (co)algebras of the (co)monad that comes from the (co)free-forgetful adjunction is the basis for doing algebra in category theory (with (co)monads, at least). However, it is somewhat unusual for a forgetful functor to have both a left and right adjoint. In many cases, something is either algebraic or coalgebraic, and not both.

<span id="note2"></span>\[2\]: Urs Schreiber informed me of an interesting interpretation of the `ConstΣ ⊣ ConstΠ` adjunction. If you are familiar with modal logic and the possible worlds semantics thereof, you can probably imagine that we could model it using something like `P : W -> Type`, where `W` is the type of possible worlds, and propositions are types. Then values of type `Σ P` demonstrate that `P` holds in particular worlds, while values of type `Π P` demonstrate that it holds in all worlds. `Const` turns these types back into world-indexed 'propositions,' so `ConstΣ` is the possibility modality and `ConstΠ` is the necessity modality.
