A couple of days ago, I gave a talk at Boston Haskell about a shiny new speculative evaluation library, [speculation](http://hackage.haskell.org/package/speculation) on hackage, that I have implemented in Haskell. The implementation is based on the material presented as ["Safe Programmable Speculative Parallelism"](http://research.microsoft.com/apps/pubs/default.aspx?id=118795) by Prakash Prabhu, G Ramalingam, and Kapil Vaswani at last month's PLDI.

I've uploaded a copy of my slides here:

\* Introducing Speculation \[[PowerPoint](http://comonad.com/reader/wp-content/uploads/2010/07/Speculation.pptx) | [PDF](http://comonad.com/reader/wp-content/uploads/2010/07/Speculation.pdf)\]

This package provides speculative function application and speculative folds. Speculative STM transactions take the place of the transactional rollback machinery from the paper, but transactions are not always required in pure code. To get a feel for the shape of the library, here is an excerpt from the [documentation](http://hackage.haskell.org/package/speculation) for one of the combinators:

> `    spec :: Eq a => a -> (a -> b) -> a -> b    `
> 
> `spec g f a` evaluates `f g` while forcing `a`, if `g == a` then `f g` is returned, otherwise `f a` is evaluated and returned. Furthermore, if the argument has already been evaluated, we skip the `f g` computation entirely. If a good guess at the value of `a` is available, this is one way to induce parallelism in an otherwise sequential task. However, if the guess isn't available more cheaply than the actual answer, then this saves no work and if the guess is wrong, you risk evaluating the function twice. Under high load, since `f g` is computed via the spark queue, the speculation will be skipped and you will obtain the same answer as `f $! a`.

ASCII art time-lines of how this can speed up evaluation are available in both the slides and the documentation linked to above, but assuming an otherwise serial problem, you effectively wager otherwise idle CPU time and the time to generate your guess on the quality of your guess.

Note that [numSparks# feature request](http://hackage.haskell.org/trac/ghc/ticket/4167) that was mentioned in the slides has already been implemented in GHC HEAD, and support shall be added to improve the performance of the speculative STM transactions under high load as mentioned in the slides.
