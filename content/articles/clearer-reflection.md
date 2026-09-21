I have updated the [reflection](http://hackage.haskell.org/package/reflection-0.2.0) package on hackage to use [an idea for avoiding dummy arguments](http://www.haskell.org/pipermail/haskell-cafe/2009-August/065237.html) posted to the [Haskell cafe mailing list](http://www.haskell.org/mailman/listinfo/haskell-cafe) by Bertram Felgenhauer, which adapts nicely to the case of handling Reflection. The reflection package implements the ideas from the [Functional Pearl: Implicit Configurations](http://www.cs.rutgers.edu/~ccshan/prepose/prepose.pdf) paper by Oleg Kiselyov and Chung-chieh Shan.

Now, you no longer need to use big scary undefineds throughout your code and can instead program with implicit configurations more naturally, using Applicative and Monad sugar.

```haskell
*Data.Reflection> reify (+)
    (reflect < *> pure 1 < *> (reflect < *> pure 2 < *> pure 3))
6
```

The Monad in question just replaces the lambda with a phantom type parameter, enabling the compiler to more readily notice that no instance can actually even try to use the value of the type parameter.

An [example from the old API](http://www.mail-archive.com/haskell-cafe@haskell.org/msg57747.html) can be seen on the Haskell cafe.

This example can be made appreciably less scary now!

```haskell
{-# LANGUAGE
     MultiParamTypeClasses,
     FlexibleInstances, Rank2Types,
     FlexibleContexts, UndecidableInstances #-}
import Control.Applicative
import Data.Reflection
import Data.Monoid
import Data.Tagged

newtype M s a = M a

instance Reifies s (a,a → a → a) ⇒ Monoid (M s a) where
    mempty = tagMonoid $ fst < $> reflect
    a `mappend` b = tagMonoid $
        snd < $> reflect < *> monoidTag a < *> monoidTag b

monoidTag :: M s a → Tagged s a
monoidTag (M a) = Tagged a

tagMonoid :: Tagged s a → M s a
tagMonoid (Tagged a) = M a

withMonoid :: a → (a → a → a) →
    (∀s. Reifies s (a, a → a → a) ⇒ M s w) → w
withMonoid e op m = reify (e,op) (monoidTag m)
```

And with that we can cram a Monoid dictionary -- or any other -- with whatever methods we want and our safety is assured by parametricity due to the rank 2 type, just like with the ST monad.

```haskell
*> withMonoid 0 (+) (M 5 `mappend` M 4 `mappend` mempty)
9
```

\[Edit: factored Tagged out into Data.Tagged in a separate package, and modified reflection to use that instead, with an appropriate version bump to satisfy the package versioning policy\]
