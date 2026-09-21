Last time, I showed that we can build a small parsec clone with packrat support.

This time I intend to implement packrat directly on top of Parsec 3.

One of the main topics of discussion when it comes to packrat parsing since Bryan Ford's initial release of Pappy has been the fact that in general you shouldn't use packrat to memoize every rule, and that instead you should apply Amdahl's law to look for the cases where the lookup time is paid back in terms of repetitive evaluation, computation time and the hit rate. This is great news for us, since, we only want to memoize a handful of expensive combinators.

First, we'll need to import enough of Parsec to do something interesting.

```haskell
{-# LANGUAGE RecordWildCards, ViewPatterns, FlexibleInstances, MultiParamTypeClasses #-}

import Text.Parsec
import qualified Text.Parsec.Token as T
import Text.Parsec.Token
    (GenLanguageDef(..), GenTokenParser(TokenParser))
import Text.Parsec.Pos (initialPos, updatePosChar)
import Data.Functor.Identity (Identity(..))
import Control.Applicative hiding ((< |>))
import Control.Monad.Fix (fix)
```

Then as before, we'll define PEG-style backtracking:

```haskell
(< />) :: Monad m => ParsecT s u m a -> ParsecT s u m a ->
    ParsecT s u m a
p < /> q = try p < |> q
infixl 3 < />
```

Now we need an analogue to our Result type from last time, which recalled whether or not we had consumed input, and what the current cursor location is. Fortunately, we can recycle the definitions from Parsec to this end.

```haskell
type Result d a = Consumed (Reply d () a)
```

We'll define a combinator to build a parser directly from a field accessor. Last time, this was just the use of the "Rat" constructor. Now it is a bit trickier, because we need to turn `Consumed (Reply d () a)` into `m (Consumed (m (Reply d u a)))` by wrapping it in the appropriate monad, and giving the user back his state unmolested.

```haskell
rat :: Monad m => (d -> Result d a) -> ParsecT d u m a
rat f   = mkPT $ \s0 -> return $
    return . patch s0 < $> f (stateInput s0) where
  patch (State _ _ u) (Ok a (State s p _) err) = Ok a (State s p u) err
  patch _             (Error e)                = Error e
```

Last time we could go from a parser to a result just by applying the user stream type, but with parsec we also have to supply their notion of a position. This leads to the following combinator. By running in the Identity monad with no user state it should be obvious that we've duplicated the functionality of the previous 'Rat' parser (with the addition of a source position).

```haskell
womp :: d -> SourcePos -> ParsecT d () Identity a -> Result d a
womp d pos p = fmap runIdentity . runIdentity $
    runParsecT p (State d pos ())
```

The combinator is so named because we needed a big space-rat rather than a little pack-rat to keep with the theme.

> It's not impossible. I used to bullseye womp rats in my T-16 back home, they're not much bigger than two meters.

Now we'll write a bit of annoyingly verbose boilerplate to convince `Parsec` that we really want a `LanguageDef` for some monad other than Identity. (As an aside, why `Text.Parsec.Language` doesn't contain GenLanguageDefs that are parametric in their choice of Monad is beyond me.)

```haskell
myLanguageDef :: Monad m => T.GenLanguageDef D u m
myLanguageDef = T.LanguageDef
  { commentStart    = "{-"
  , commentEnd      = "-}"
  , commentLine     = "--"
  , nestedComments  = True
  , identStart      = letter < |> char '_'
  , identLetter     = alphaNum < |> oneOf "_'"
  , opStart         = opLetter myLanguageDef
  , opLetter        = oneOf ":!#$%&*+./< =>?@\\^|-~"
  , reservedOpNames = []
  , reservedNames   = []
  , caseSensitive   = True
  }
```

As a shameless plug, trifecta offers a particularly nice solution to this problem, breaking up the monolithic Token type into separate concerns and letting you layer parser transformers that enrich the parser to deal with things like Haskell-style layout, literate comments, parsing comments in whitespace, etc.

And as one last bit of boilerplate, we'll abuse RecordWildcards once again to avoid the usual 20 lines of boilerplate that are expected of us, so we can get access to parsec's token parsers.

```haskell
TokenParser {..} = T.makeTokenParser myLanguageDef
```

Now we're ready to define our incredibly straightforward stream type:

```haskell
data D = D
  { _add        :: Result D Integer
  , _mult       :: Result D Integer
  , _primary    :: Result D Integer
  , _dec        :: Result D Integer
  , _uncons     :: Maybe (Char, D)
  }

instance Monad m => Stream D m Char where
  uncons = return . _uncons
```

And using the general purpose `rat` combinator from earlier, we can write some memoized parsers:

```haskell
add, mult, primary, dec :: Parsec D u Integer
add     = rat _add
mult    = rat _mult
primary = rat _primary
dec     = rat _dec
```

And finally, we write the code to tie the knot and build the stream:

```haskell
parse :: SourceName -> String -> D
parse n = go (initialPos n) where
  go p s = fix $ \d -> let
    (womp d p -> _add) =
            (+) < $> mult < * reservedOp "+" <*> add
        < /> mult < ?> "summand"
    (womp d p -> _mult) =
            (*) < $> primary < * reservedOp "*" <*> mult
        < /> primary < ?> "factor"
    (womp d p -> _primary) =
            parens add
        < /> dec < ?> "number"
    (womp d p -> _dec) = natural
    _uncons = case s of
      (x:xs) -> Just (x, go (updatePosChar p x) xs)
      []     -> Nothing
    in D { .. }

runD :: Parsec D u a -> u -> SourceName -> String -> Either ParseError a
runD p u fn s = runParser p u fn (prep fn s)
```

and finally, let it rip:

```haskell
eval :: String -> Integer
eval s = either (error . show) id $
    runD (whiteSpace *> add < * eof) () "-" s
```

While this approach tends to encourage memoizing fewer combinators than libraries such as frisby, this is exactly what [current research suggests you probably should do](http://www.mercury.csse.unimelb.edu.au/information/papers/packrat.pdf) with packrat parsing!

The other purported advantage of packrat parsers is that they [can deal with left recursion in the grammar](http://www.vpri.org/pdf/tr2007002_packrat.pdf). However, that is not the case, hidden left recursion in the presence of the algorithm used in the scala parsing combinator libraries leads to incorrect non-left-most parses [as shown by Tratt](http://tratt.net/laurie/research/publications/papers/tratt__direct_left_recursive_parsing_expression_grammars.pdf).

I leave it as an exercise for the reader to extend this material with the parsec+iteratees approach from my original talk on trifecta to get packrat parsing of streaming input. Either that or you can wait until it is integrated into trifecta.

You can download the source to this (without the spurious spaces inserted by wordpress) [here](https://github.com/ekmett/trifecta/blob/master/wip/Womprat.hs).

If I can find the time, I hope to spend some time addressing Scott and Johnstone's GLL parsers, which actually achieve the O(n^3) worst case bounds touted for Tomita's GLR algorithm (which is actually O(n^4) as it was originally defined despite the author's claims), and how to encode them in Haskell with an eye towards building a memoizing parser combinator library that can parse LL(1) fragments in O(1), deal with arbitrary context-free grammars in O(n^3), and degrade reasonably gracefully in the presence of context-sensitivity, while supporting hidden left recursion as long as such recursion passes through at least one memoized rule. This is important because CFGs are closed under extensions to the grammar, which is a nice property to have if you want to have a language where you can add new statement types easily without concerning yourself overmuch with the order in which you insert the rules or load the different extensions.
