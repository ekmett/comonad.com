If we take a look at the Haskell (.) operator:

`    (.) :: (a -> b) -> (e -> a) -> e -> b    `

and take a moment to reflect on the type of fmap

`    fmap :: Functor f => (a -> b) -> f a -> f b    `

and the unnamed Reader monad from [Control.Monad.Reader](http://haskell.org/ghc/docs/latest/html/libraries/mtl/Control-Monad-Reader.html)

`    instance Functor ((->) r)    `

we see that fmap applied to the Reader functor rederives (.).

`    fmap_reader :: (a -> b) -> (e -> a) -> e -> b    `

So if we were willing to forgo ease of learning, and to bake in the Reader monad as a primitive, we could quite concisely redefine (.) to give it a more general signature:

`    module Dot where   import Control.Monad.Reader   import Prelude hiding ((.))   infixr 0 .   (.) :: Functor f => (a -> b) -> f a -> f b   (.) = fmap    `

In this context, existing code continues to type check. For instance,

`    ((+2) . (*3)) 5 ==> 17    `

And the . above doubles as filling the role of the \* map operator mentioned in Richard Bird's 1990 Calculus of Functions paper generalized to any Functor.

`    ((+2) . (*3)) . [1..10] ==> [5,8,..32]   ((+2) . (*3)) . Just 5 ==> Just 17   ((+2) . (*3)) . Nothing ==> Nothing    `

I was able to test this with the just about every example golfed back and forth on the [#haskell](irc://irc.freenode.net/%23haskell) channel in the last 6 months.

I'm not advocating this as a practice for Haskell as it is somewhat terrifying to think of how to teach to new programmers, but I found the exercise to be enlightening.
