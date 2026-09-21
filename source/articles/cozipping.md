[Twan van Laarhoven](http://twan.home.fmf.nl/) [pointed out](http://comonad.com/reader/2008/zipping-and-unzipping-functors/#comments) that fzip from the other day is a close cousin of applicative chosen to be an inverse of the universal construction 'unfzip'.

During that post I also put off talking about the dual of zipping, so I figured I'd bring up the notion of choosing a notion of 'cozipping' by defining it as an inverse to a universally definable notion of 'counzipping'.

\[Edit: Twan pointed out I had flipped which was the dual of zip, revised\]

Abusing the new category-extras to avoid making an enormous post and recycling the constructions from the previous post, we can define:

```haskell
{-# LANGUAGE FlexibleInstances #-}
module Control.Functor.Cozip where

import Control.Arrow ((|||),(+++))
import Control.Monad.Identity
import Control.Bifunctor.Biff
import Control.Bifunctor.Fix
```

The same inverse question leads to some observations about the dual of fzip as opposed to its inverse.

We could call them cozip and uncozip for lack of a better name, but as we will see cozip is more accurately about deciding classifying the contents of the functor, so maybe deserves a better, more evocative name like 'decide' or 'cleave'.

counzip and its bifunctorial equivalent always exist.

```haskell
counzip :: Functor f => Either (f a) (f b) -> f (Either a b)
counzip = fmap Left ||| fmap Right

counbizip :: Bifunctor f => Either (f a c) (f b d) -> f (Either a b) (Either c d)
counbizip = bimap Left Left ||| bimap Right Right
```

But there are some cases where its inverse doesn't exist, such as the Reader/State monads, or where uncozip only has a right inverse like with Maybe/Either.

Counzipping basically demonstrates the fact that if I have either a container of a's or a container of b's, I can treat that as a container of 'as or bs', giving up the knowledge that the container contains entirely one or the other.

Its inverse describes the cases where we can recover this information.

```haskell
class Functor f => Cozip f where
   cozip :: f (Either a b) -> Either (f a) (f b)

instance Cozip Identity where
   cozip = bimap Identity Identity . runIdentity
```

Now, in general a functor that has more than one 'hole' will not be recoverable because one hole could contain an a, and the other could contain a b, so you would be unable to perform the split. Futhermore unless there is a way to decide the value contained you'll never be able to tell which branch of the Either to return, so functors like the reader/state monads are out.

However, this does not close the door to a few other functors:

```haskell
instance Cozip ((,)c) where
   cozip (c,ab) = bimap ((,)c) ((,)c) ab

-- ambiguous choice
instance Cozip Maybe where
   cozip = maybe (Left Nothing) (bimap Just Just)
-- cozip = maybe (Right Nothing) (bimap Just Just)

-- ambiguous choice
instance Cozip (Either c) where
   cozip = (Left . Left) ||| bimap Right Right
-- cozip = (Right . Left) ||| bimap Right Right
```

Note that the definitions for Maybe and (Either c) had to 'choose' where to put the "Nothing/Left" term. Consequently they are only right-inverses of counzip.

You can also go and generate one that says that the functor coproduct of a pair of cozippable functors is cozippable, just like the functor product of a pair of zippable functors is zippable (given by the construction given for BiffB the other day).

Finally, the only surprising instance is for the free monad of a cozippable functor.

```haskell
-- instance Cozip f => Cozip (Free f) where
instance Cozip f => Cozip (FixB (BiffB Either Identity f)) where
   cozip (InB (BiffB (Left (Identity (Left a))))) = Left (InB (BiffB (Left (Identity a))))
   cozip (InB (BiffB (Left (Identity (Right a))))) = Right (InB (BiffB (Left (Identity a))))
   cozip (InB (BiffB (Right as))) = ((InB . BiffB . Right) +++ (InB . BiffB . Right)) (cozip (fmap cozip as))
```

This says that even though Either is not 'bicozippable' - which appears to be an ill-defined concept - we can build up a general cozip for the free monad of an cozippable functor. The reason is that if your functor only has one place to put a value, then putting the free monad in that place just means that you have to search longer.

So, we've found the fact that free monads of cozippable functors are cozippable, in contrast to the conclusion of the other day that cofree comonads of zippable functors are zippable.
