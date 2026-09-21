> You never heard of the Millenium Falcon? It's the ship that made the Kessel Run in 12 parsecs.

I've been working on a parser combinator library called [trifecta](http://hackage.haskell.org/package/trifecta), and so I decided I'd share some thoughts on parsing.

[Packrat parsing](http://pdos.csail.mit.edu/~baford/packrat/) (as provided by [frisby](http://hackage.haskell.org/package/frisby), [pappy](http://hackage.haskell.org/package/pappy), [rats!](http://cs.nyu.edu/rgrimm/xtc/) and the Scala parsing combinators) and more traditional recursive descent parsers (like Parsec) are often held up as somehow different.

Today I'll show that you can add monadic parsing to a packrat parser, sacrificing asymptotic guarantees in exchange for the convenient context sensitivity, and conversely how you can easily add packrat parsing to a traditional monadic parser combinator library.

To keep this post self-contained, I'm going to start by defining a small packrat parsing library by hand, which acts rather like parsec in its backtracking behavior. First, some imports:

```haskell
{-# LANGUAGE RecordWildCards, ViewPatterns, DeriveFunctor #-}
import Control.Applicative
import Control.Monad (MonadPlus(..), guard)
import Control.Monad.Fix (fix)
import Data.Char (isDigit, digitToInt, isSpace)
```

Second, we'll define a bog simple parser, which consumes an input stream of type d, yielding a possible answer and telling us whether or not it has actually consumed any input as it went.

```haskell
newtype Rat d a = Rat { runRat :: d -> Result d a }
  deriving Functor

data Result d a
  = Pure a             -- didn't consume anything, can backtrack
  | Commit d a      -- consumed input
  | Fail String Bool -- failed, flagged if consumed
  deriving Functor
```

Now, we can finally implement some type classes:

```haskell
instance Applicative (Rat d) where
  pure a = Rat $ \ _ -> Pure a
  Rat mf < *> Rat ma = Rat $ \ d -> case mf d of
    Pure f      -> fmap f (ma d)
    Fail s c    -> Fail s c
    Commit d' f -> case ma d' of
      Pure a       -> Commit d' (f a)
      Fail s _     -> Fail s True
      Commit d'' a -> Commit d'' (f a)
```

including an instance of Alternative that behaves like parsec, only backtracking on failure if no input was unconsumed.

```haskell
instance Alternative (Rat d) where
  Rat ma < |> Rat mb = Rat $ \ d -> case ma d of
    Fail _ False -> mb d
    x            -> x
  empty = Rat $ \ _ -> Fail "empty" False
```

For those willing to forego the asymptotic guarantees of packrat, we'll offer a monad.

```haskell
instance Monad (Rat d) where
  return a = Rat $ \_ -> Pure a
  Rat m >>= k = Rat $ \d -> case m d of
    Pure a -> runRat (k a) d
    Commit d' a -> case runRat (k a) d' of
      Pure b -> Commit d' b
      Fail s _ -> Fail s True
      commit -> commit
    Fail s c -> Fail s c
  fail s = Rat $ \ _ -> Fail s False

instance MonadPlus (Rat d) where
  mplus = (< |>)
  mzero = empty
```

and a Parsec-style "try", which rewinds on failure, so that < |> can try again.

```haskell
try :: Rat d a -> Rat d a
try (Rat m) = Rat $ \d -> case m d of
  Fail s _ -> Fail s False
  x        -> x
```

Since we've consumed < |> with parsec semantics. Let's give a PEG-style backtracking (< />).

```haskell
(< />) :: Rat d a -> Rat d a -> Rat d a
p < /> q = try p < |> q
infixl 3 < />
```

So far nothing we have done involves packrat at all. These are all general purpose recursive descent combinators.

We can define an input stream and a number of combinators to read input.

```haskell
class Stream d where
  anyChar :: Rat d Char

whiteSpace :: Stream d => Rat d ()
whiteSpace = () < $ many (satisfy isSpace)
phrase :: Stream d => Rat d a -> Rat d a
phrase m = whiteSpace *> m < * eof

notFollowedBy :: Rat d a -> Rat d ()
notFollowedBy (Rat m) = Rat $ \d -> case m d of
  Fail{} -> Pure ()
  _      -> Fail "unexpected" False

eof :: Stream d => Rat d ()
eof = notFollowedBy anyChar

satisfy :: Stream d => (Char -> Bool) -> Rat d Char
satisfy p = try $ do
  x < - anyChar
  x <$ guard (p x)

char :: Stream d => Char -> Rat d Char
char c = satisfy (c ==)

lexeme :: Stream d => Rat d a -> Rat d a
lexeme m = m < * whiteSpace

symbol :: Stream d => Char -> Rat d Char
symbol c = lexeme (char c)

digit :: Stream d => Rat d Int
digit = digitToInt < $> satisfy isDigit
```

And we can of course use a string as our input stream:

```haskell
instance Stream [Char] where
  anyChar = Rat $ \s -> case s of
    (x:xs) -> Commit xs x
    [] -> Fail "EOF" False
```

Now that we've built a poor man's Parsec, let's do something more interesting. Instead of just using String as out input stream, let's include slots for use in memoizing the results from our various parsers at each location. To keep things concrete, we'll memoize the ArithPackrat.hs example that Bryan Ford used in his initial packrat presentation enriched with some whitespace handling.

```haskell
data D = D
  { _add        :: Result D Int
  , _mult       :: Result D Int
  , _primary    :: Result D Int
  , _decimal    :: Result D Int
  , anyCharD    :: Result D Char
  }
```

If you look at the type of each of those functions you'll see that `_add :: D -> Result D Int`, which is exactly our Rat newtype expects as its argument, we we can bundle them directly:

```haskell
add, mult, primary, decimal :: Rat D Int
add     = Rat _add
mult    = Rat _mult
primary = Rat _primary
decimal = Rat _decimal
```

We can similarly juse use the character parse result.

```haskell
instance Stream D where
  anyChar = Rat anyCharD
```

Now we just need to build a D from a String. I'm using view patterns and record wildcards to shrink the amount of repetitive naming.

```haskell
parse :: String -> D
parse s = fix $ \d -> let
  Rat (dv d -> _add) =
        (+) < $> mult < * symbol '+' <*> add
     < /> mult
  Rat (dv d -> _mult) =
        (*) < $> primary < * symbol '*' <*> mult
    < /> primary
  Rat (dv d -> _primary) =
        symbol '(' *> add < * symbol ')'
    </> decimal
  Rat (dv d -> _decimal) =
     foldl' (\b a -> b * 10 + a) 0 < $> lexeme (some digit)
  anyCharD = case s of
    (x:xs) -> Commit (parse xs) x
    []     -> Fail "EOF" False
  in D { .. }

dv :: d -> (d -> b) -> b
dv d f = f d
```

Note that we didn't really bother factoring the grammar, since packrat will take care of memoizing the redundant calls!

And with that, we can define an evaluator.

```haskell
eval :: String -> Int
eval s = case runRat (whiteSpace *> add < * eof) (parse s) of
  Pure a -> a
  Commit _ a -> a
  Fail s _ -> error s
```

Note that because the input stream D contains the result directly and parse is the only thing that ever generates a D, and it does so when we start up, it should be obvious that the parse results for each location can't depend on any additional information smuggled in via our monad.

Next time, we'll add a packratted Stream type directly to Parsec, which will necessitate some delicate handling of user state.

The small parser implemented here can be [found on my github account](https://github.com/ekmett/trifecta/blob/master/wip/Rat.hs), where it hasn't been adulterated with unnecessary spaces by my blog software.

P.S. To explain the quote, had I thought of it earlier, I could have named my parsing combinator library "Kessel Run" as by the time I'm done with it "it will contain at least 12 parsecs" between its different parser implementations.
