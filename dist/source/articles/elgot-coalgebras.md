```haskell
import Control.Arrow ((|||),(&&&),left)
newtype Mu f = InF { outF :: f (Mu f) }
```

I want to talk about a novel recursion scheme that hasn't received a lot of attention from the Haskell community and its even more obscure dual -- which is necessarily more obscure because I believe this is the first time anyone has talked about it.

[Jiri Adámek](http://www.iti.cs.tu-bs.de/~adamek/adamek.html), [Stefan Milius](http://www.iti.cs.tu-bs.de/~milius/) and [Jiri Velebil](http://math.feld.cvut.cz/velebil/) have done a lot of work on [Elgot algebras](http://arxiv.org/abs/cs/0609040). Here I'd like to translate them into Haskell, dualize them, observe that the dual can encode primitive recursion, and provide some observations.

You can kind of think an Elgot algebra as a hylomorphism that cheats.

```haskell
elgot :: Functor f => (f b -> b) -> (a -> Either b (f a)) -> a -> b
elgot phi psi = h where h = (id ||| phi . fmap h) . psi
```

If you look at the signature for a hylomorphism:

```haskell
hylo :: Functor f => (f b -> b) -> (a -> f a) -> a -> b
hylo phi psi = h where h = phi . fmap h . psi
```

Then you can see that an Elgot algebra is basically a hylomorphism that is allowed to shortcircuit the infinite tower of fmaps and return an intermediate result directly.

In some sense you can say that the coalgebra-like side of the hylomorphism is no longer oblivious to the algebra used to deconstruct the intermediate result.

We can take the Elgot algebra and dualize it to get a novel construction where the algebra-like side is no longer oblivious to the coalgebra. This allows your algebra to cheat and just use the intermediate results constructed by the anamorphism to return an answer. I'll choose to call this co-(Elgot algebra) an Elgot coalgebra in the sequel.

```haskell
coelgot :: Functor f => ((a, f b) -> b) -> (a -> f a) -> a -> b
coelgot phi psi = h where h = phi . (id &&& fmap h . psi)
```

In a lot of ways an Elgot algebra resembles Vene and Uustalu's [apomorphism](http://citeseer.ist.psu.edu/vene98functional.html).

```haskell
apo :: Functor f => (a -> f (Either (Mu f) a)) -> a -> Mu f
apo psi = h where h = InF . fmap h . (fmap Left . outF ||| psi) . Right
```

However, we have 'unfixed' the algebra to be used from InF to something more general and the layering of Either and f is different.

Now, a generalized apomorphism does something similar entangling two coalgebras, but the signature doesn't quite match up either, since a generalized apomorphism uses an F-coalgebras and an F-(b + \_)-monadic coalgebra.

```haskell
g_apo :: Functor f => (b -> f b) -> (a -> f (Either b a)) -> a -> Mu f
g_apo g f = h where h = InF . fmap h . (fmap Left . g ||| f) . Right
```

Similarly a zygomorphism, or more generally a [mutumorphism](http://dbappl.cs.utwente.nl/Publications/PaperStore/db-utwente-0000003537.pdf) entangles two algebras.

An Elgot algebra occupies a somewhat rare spot in the theory of constructive algorithmics or recursion schemes in that it while it mixes an algebra with a coalgebra like a hylomorphism or metamorphisms, it entangles them in a novel way.

If we specialize the Elgot algebra by fixing its algebra to InF we get:

```haskell
elgot_apo :: Functor f => (a -> Either (Mu f) (f a)) -> a -> Mu f
elgot_apo psi = h where h = (id ||| InF . fmap h) . psi
```

We can see that the type is now closely related to that of an apomorphism with some slight changes in design decisions. Instead of wrapping a functor around further seeds, a, or a finished structure, this specialized Elgot algebra returns the finished structure directly or an f wrapped around seeds.

## The Good

So can we convert between an apomorphism and an Elgot algebra? For a somewhat circuitous path to that answer lets recall the [definition of strength](http://comonad.com/reader/2008/deriving-strength-from-laziness/) from my post a couple of weeks ago. Flipping the arguments and direction of application for strength to simplify what is coming we get:

```haskell
strength' :: Functor f => t -> f a -> f (t, a)
strength' fa b = fmap ((,)b) fa
```

With that in hand we quickly find that we can rederive [paramorphisms](http://en.wikipedia.org/wiki/Paramorphism) (and hence primitive recursion) from the novel notion of an Elgot coalgebra that we defined above by leaning on the strength of our functor.

```haskell
para :: Functor f => (f (Mu f, c) -> c) -> Mu f -> c
para f = coelgot (f . uncurry strength') outF
```

This result tells us that the shiny new Elgot coalgebras we defined above are strong enough to encode primitive recursion when working in Haskell.

## The Bad

This tempts us to try to derive apomorphisms from Elgot algebras using the dual case, costrength. However, if you'll recall from my previous post on comonadic costrength, we can't do that in general. The result is only defined for Traversable functors; not every functor is costrong in Haskell!

Consequently and counterintuitively, though we can define a paramorphism in terms of Elgot coalgebras, we can only define an apomorphism in terms of Elgot algebras for traversable functors.

## The Ugly

Now, worse news. Since the tower of functors we build up doesn't run off to infinity we lose the ability to generalize Elgot (co)algebras using the same machinery we can use to generalize the various traditional recursion schemes by parameterizing it by a (co)monad and distributive law.

At least the straightforward translation fails. For instance in the case of an Elgot algebra, the obvious addition would be to allow for the algebra (f a -> a) to be replaced with a F-W-comonadic algebra (f (w a) -> a) for some comonad w. However, attempts to do so run afoul of the fact that the coalgebra-like structure feeds us an 'a' not a 'w a'. We can of course change the signature of the coalgebra to give us the comonad, but the breakdown of modularity is unfortunate.

Similary, parameterizing the coalgebra-like structure with a monad requires the ability to distribute the monad over Either b to get to where it can apply the distributive law for the base functor f. Interestingly the Either monad works, which gives us ways to compose Elgot (co)algebras, but that is a story for another day.

As usual there is a tradeoff in expressivity in one area to compensate for gains in another, but this manner of entangling provides us with a new set of possibilities to explore.

Code for Elgot algebras and Elgot coalgebras has been included in [category-extras](http://hackage.haskell.org/cgi-bin/hackage-scripts/package/category-extras-0.50.3) as of release 0.50.3 as [Control.Functor.Algebra.Elgot](http://comonad.com/haskell/category-extras/src/Control/Functor/Algebra/).

Now available from hackage.
