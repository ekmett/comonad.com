I haven't seen written up anywhere the following operator (g\_hylo), defined in the spirit of generalized catamorphisms and generalized anamorphisms, which seems to follow rather naturally from the definition of both -- I'm using liftW & liftM rather than fmap to make it clear what is being lifted over what.

```haskell
class Functor w => Comonad w where
        -- minimal definition: extend & extract or duplicate & extract
        duplicate :: w a -> w (w a)
        extend :: (w a -> b) -> w a -> w b
        extract :: w a -> a
        extend f = fmap f . duplicate
        duplicate = extend id

liftW :: Comonad w => (a -> b) -> w a -> w b
liftW f = extend (f . extract)

g_hylo :: (Comonad w, Functor f, Monad m) =>
          (forall a. f (w a) -> w (f a)) ->
          (forall a. m (f a) -> f (m a)) ->
          (f (w b) -> b) ->
          (a -> f (m a)) ->
          a -> b
g_hylo w m f g =
     extract .
     hylo (liftW f . w . fmap duplicate) (fmap join . m . liftM g)
     . return
   where
     hylo f g = f . fmap (hylo f g) . g
```

In the above, w and m are the distributive laws for the comonad and monad respectively, and hylo is a standard hylomorphism. In the style of [Dave Menendez](http://www.eyrie.org/~zednenem/)'s [Control.Recursion](http://www.eyrie.org/~zednenem/2004/hsce/Control.Recursion.html) code it would be a 'refoldWith' and it can rederive a whole lot of recursion and corecursion patterns if not all of them.

Anyone?
