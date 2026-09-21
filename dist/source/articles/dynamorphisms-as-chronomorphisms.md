In case it wasn't obvious, I thought I should mention that Kabanov and Vene's [dynamorphisms](http://citeseer.ist.psu.edu/748315.html) which optimize histomorphisms for dynamic programming can be expressed readily as [chronomorphisms](http://comonad.com/reader/2008/time-for-chronomorphisms/); they just use an [anamorphism](http://en.wikipedia.org/wiki/Anamorphism) instead of a [futumorphism](http://www.mii.lt/informatica/pdf/INFO141.pdf).

```haskell
-- | dynamorphism
dyna :: Functor f =>
  (f (Cofree f b) -> b) ->
  (a -> f a) ->
  (a -> b)
dyna f g = extract . dyna' f g

-- | dynamorphism kernel
dyna' :: Functor f =>
  (f (Cofree f b) -> b) ->
  (a -> f a) ->
  (a -> Cofree f b)
--dyna' f g = hylo (Cofree . (f &&& id)) g
dyna' f g = chrono' f (fmap return . g) . return

-- | generalized dynamorphism
g_dyna :: (Functor f, Functor h) =>
  (forall b. f (h b) -> h (f b)) ->
  (f (Cofree h b) -> b) ->
  (a -> f a) ->
  (a -> b)
g_dyna k f g = extract . g_dyna' k f g

-- | generalized dynamorphism kernel
g_dyna' :: (Functor f, Functor h) =>
  (forall b. f (h b) -> h (f b)) ->
  (f (Cofree h b) -> b) ->
  (a -> f a) ->
  (a -> Cofree h b)
g_dyna' k f g = g_chrono' k id f (fmap return . g) . return
```

Moreover, as an interesting aside, since one side is an anamorphism, there is no power to be gained for a dynamorphism by [introducing a natural transformation](http://comonad.com/reader/2008/unnatural-transformations/) term, even though dynamorphism is a form of chronomorphism, because 'eta' can be folded into the anamorphism side of the chronomorphism, as you do with a normal hylomorphism.

[Source Code](http://comonad.com/haskell/Chronomorphism.hs)
