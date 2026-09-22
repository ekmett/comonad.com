Recently, a fellow in category land [discovered](http://golem.ph.utexas.edu/category/2012/09/where_do_monads_come_from.html) a fact that we in Haskell land have actually known for a while (in addition to things most of us probably don't). Specifically, given two categories $\mathcal{C}$ and $\mathcal{D}$, a functor $G : \mathcal{C} \rightarrow \mathcal{D}$, and provided some conditions in $\mathcal{D}$ hold, there exists a monad $T^G$, the codensity monad of $G$.

In category theory, the codensity monad is given by the rather frightening expression:

$ T^G(a) = \int_r \left[\mathcal{D}(a, Gr), Gr\right] $

Where the integral notation denotes an [end](http://comonad.com/reader/2008/kan-extension-iii/), and the square brackets denote a [power](http://nlab.mathforge.org/nlab/show/power), which allows us to take what is essentially an exponential of the objects of $\mathcal{D}$ by objects of $\mathcal{V}$, where $\mathcal{D}$ is [enriched](http://nlab.mathforge.org/nlab/show/enriched+category) in $\mathcal{V}$. Provided the above end exists, $T^G$ is a monad regardless of whether $G$ has an [adjoint](http://comonad.com/reader/2008/kan-extensions-ii/), which is the usual way one thinks of functors (in general) giving rise to monads.

It also turns out that this construction is a sort of generalization of the adjunction case. If we do have $F \dashv G$, this gives rise to a monad $GF$. But, in such a case, $T^G \cong GF$, so the codensity monad is the same as the monad given by the adjunction when it exists, but codensity may exist when there is no adjunction.

In Haskell, this all becomes a bit simpler (to my eyes, at least). Our category $\mathcal{D}$ is always $\mathbf{Hask}$, which is enriched in itself, so powers are just function spaces. And all the functors we write will be rather like $\mathbf{Hask}$ (objects will come from kinds we can quantify over), so ends of functors will look like `forall r. F r r` where $F : \mathcal{C}^{op} \times \mathcal{C} \rightarrow \mathbf{Hask}$. Then:  
`    newtype Codensity f a = Codensity (forall r. (a -> f r) -> f r)    `

As mentioned, we've known for a while that we can write a Monad instance for `Codensity f` without caring at all about `f`.

As for the adjunction correspondence, consider the adjunction between products and exponentials: $ - \times S \dashv S \rightarrow - $

This gives rise to the monad $S \rightarrow (- \times S)$, the state monad. According to the facts above, we should have that `Codensity (s ->)` (excuse the sectioning) is the same as state, and if we look, we see:  
`    forall r. (a -> s -> r) -> s -> r    `

which is the continuation passing, or Church (or [Boehm-Berarducci](http://comments.gmane.org/gmane.comp.lang.haskell.cafe/100508)) encoding of the monad.

Now, it's also well known that for any monad, we can construct an adjunction that gives rise to it. There are multiple ways to do this, but the most accessible in Haskell is probably via the Kleisli category. So, given a monad $M$ on $\mathbf{Hask}$, there is a category $\mathbf{Hask}_M$ with the same objects, but where $\mathbf{Hask}_M(a, b) = \mathbf{Hask}(a, Mb)$. The identity for each object is `return` and composition of arrows is:  
`    (f >=> g) x = f x >>= g    `

Our two functors are:  
`   F a = a   F f = return . f`

U a = M a  
U f = (>>= f)  

Verifying that $F \dashv U$ requires only that $\mathbf{Hask}_M(F-, =) \cong \mathbf{Hask}(-, U\!\!=)$, but this is just $\mathbf{Hask}(-, M\!\!=) \cong \mathbf{Hask}(-, M\!\!=)$, which is a triviality. Now we should have that $T^U = M$.

So, one of the simplest monads is reader, $(e \rightarrow)$. Now, $U$ just takes objects in the Kleisli category (which are objects in $\mathbf{Hask}$) and applies $M$ to them, so we should have `Codensity (e ->)` is reader. But earlier we had `Codensity (e ->)` was state. So reader is state, right?

We can actually arrive at this result another way. One of the most famous pieces of category theory is the [Yoneda lemma](http://blog.sigfpe.com/2006/11/yoneda-lemma.html), which states that the following correspondence holds for any functor $F : \mathcal{C} \rightarrow \mathbf{Set}$:

$ Fa \,\, \cong \, \mathbf{Set}^\mathcal{C}\left(C(a,-), F\right) $

This also works for any functor into $\mathbf{Hask}$ and looks like:  
`    F a ~= forall r. (a -> r) -> F r    `

for $F : \mathbf{Hask} \rightarrow \mathbf{Hask}$. But we also have our functor $U : \mathbf{Hask}_M \rightarrow \mathbf{Hask}$, which should look more like:

```haskell
 U a ~= forall r. (a -> M r) -> U r
M a ~= forall r. (a -> M r) -> M r
```

So, we fill in `M = (e ->)` and get that reader is isomorphic to state, right? What's going on?

To see, we have to take a closer look at natural transformations. Given two categories $\mathcal{C}$ and $\mathcal{D}$, and functors $F, G : \mathcal{C} \rightarrow \mathcal{D}$, a natural transformation $\phi : F \Rightarrow G$ is a family of maps $\phi_a : Fa \rightarrow Ga$ such that for every $f : a \rightarrow b$ the following diagram commutes:



<figure class="category-diagram"><img src="/figures/naturality-square.svg" alt="Fa, Ga, Fb, Gb; ϕₐ, Ff, Gf, ϕᵦ"></figure>



The key piece is what the morphisms look like. It's well known that parametricity ensures the naturality of `t :: forall a. F a -> G a` for $F, G : \mathbf{Hask} \rightarrow \mathbf{Hask}$, and it also works when the source is $\mathbf{Hask}^{op}$. It should also work for a category, call it $\mathbf{Hask}^{\sim}$, which has Haskell types as objects, but where $\mathbf{Hask}^{\sim}(a, b) = \mathbf{Hask}(a, b) \times \mathbf{Hask}(b, a)$, which is the sort of category that `newtype Endo a = Endo (a -> a)` is a functor from. So we should be at liberty to say:  
`    Codensity Endo a = forall r. (a -> r -> r) -> r -> r ~= [a]    `

However, hom types for $\mathbf{Hask}_M$ are not merely made up of $\mathbf{Hask}$ hom types on the same arguments, so naturality turns out not to be guaranteed. A functor $F : \mathbf{Hask}_M \rightarrow \mathbf{Hask}$ must take a Kleisli arrow $f : b \rightarrow Mc$ to an arrow $Ff : Fb \rightarrow Fc$, and transformations must commute with that mapping. So, if we look at our use of Yoneda, we are considering transformations $\phi : \mathbf{Hask}_M(a, -) \Rightarrow U$:



<figure class="category-diagram"><img src="/figures/representable-square.svg" alt="Haskₘ(a, b), Ub, Haskₘ(a, c), Uc; ϕₐ, Haskₘ(a, f), Uf, ϕₕ"></figure>



Now, $\mathbf{Hask}_M(a,b) = \mathbf{Hask}(a, Mb)$ and $Ub = Mb$. So

`t :: forall r. (a -> M r) -> M r`

will get us the right type of maps. But, the above commutative square corresponds to the condition that for all `f :: b -> M c`:  
`    t . (>=> f) = (>>= f) . t    `

So, if we have `h :: a -> M b`, Kleisli composing it with `f` and then feeding to `t` is the same as feeding `h` to `t` and then binding the result with `f`.

Now, if we go back to reader, we can consider the reader morphism:  
`    f = const id :: a -> e -> e    `

For all relevant `m` and `g`, `m >>= f = id` and `g >=> f = f`. So the  
naturality condition here states that `t f = id`.

Now, `t :: forall r. (a -> e -> r) -> e -> r`. The general form of these is state actions (I've split `e -> (a, e)` into two pieces):

```haskell
t f e = f (v e) (st e)
  where
  rd :: e -> a
  st :: e -> e
```

If `f = const id`, then:

```haskell
t (const id) e = st e
 where
 st :: e -> e
```

But our naturality condition states that this must be the identity, so we must have `st = id`. That is, the naturality condition selects `t` for which the corresponding state action does not change the state, meaning it is equivalent to a reader action! Presumably the definition of an end (which involves dinaturality) enforces a similar condition, although I won't work through it, as it'd be rather more complicated.

However, we have learned a lesson. Quantifiers do not necessarily enforce (di)naturality for every category with objects of the relevant kind. It is important to look at the hom types, not just the objects .In this case, the point of failure seems to be the common, extra `s`. Even though the type contains nautral transformations for the similar functors over $\mathbf{Hask}$, they can (in general) still manipulate the shared parameter in ways that are not natural for the domain in question.

I am unsure of how exactly one could enforce the above condition in (Haskell's) types. For instance, if we consider:

`forall r m. Monad m => (a -> m r) -> m r`

This still contains transformations of the form:

`t k = k a >> k a`

And for this to be natural would require:

`(k >=> f) a >> (k >=> f) a = (k a >> k a) >>= f`

Which is not true for all possible instantiations of f. It seems as though leaving `m` unconstrained would be sufficient, as all that could happen is `t` feeding a value to `k` and yielding the result, but it seems likely to be over-restrictive.
