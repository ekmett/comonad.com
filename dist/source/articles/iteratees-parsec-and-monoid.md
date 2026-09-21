I was asked to give two talks at the [Boston Area Haskell User Group](http://groups.google.com/group/bostonhaskell) for this past Tuesday. The first was pitched at a more introductory level and the second was to go deeper into what I have been using monoids for lately.

The first talk covers an introduction to the mathematical notion of a monoid, introduces some of the features of my Haskell monoids library on hackage, and starts to motivate the use of monoidal parallel/incremental parsing, and the modification use of compression algorithms to recycle monoidal results.

The second talk covers a way to generate a locally-context sensitive parallel/incremental parser by modifying [Iteratees](http://okmij.org/ftp/Haskell/Iteratee/Iteratee.hs) to enable them to drive a [Parsec 3](http://hackage.haskell.org/package/parsec-3.0.0) lexer, and then wrapping that in a monoid based on [error productions](http://dragonbook.stanford.edu/lecture-notes/Columbia-COMS-W4115/08-03-05.html) in the grammar before recycling these techniques at a higher level to deal with parsing seemingly stateful structures, such as Haskell layout.

1.  [Introduction To Monoids (PDF)](http://comonad.com/reader/wp-content/uploads/2009/08/IntroductionToMonoids.pdf)
2.  [Iteratees, Parsec and Monoids: A Parsing Trifecta (PDF)](http://comonad.com/reader/wp-content/uploads/2009/08/A-Parsing-Trifecta.pdf)

Due to a late start, I was unable to give the second talk. However, I did give a quick run through to a few die-hards who stayed late and came to the [Cambridge Brewing Company](http://www.cambrew.com/) afterwards. As I promised some people that I would post the slides after the talk, here they are.

The current plan is to possibly give the second talk in full at either the September or October Boston Haskell User Group sessions, depending on scheduling and availability.

\[ [Iteratee.hs](http://comonad.com/reader/wp-content/uploads/2009/08/Iteratee.hs) \]
