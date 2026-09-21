Emil Axelsson and Koen Claessen wrote a functional pearl last year about [Using Circular Programs for Higher-Order Syntax](http://www.cse.chalmers.se/~emax/documents/axelsson2013using.pdf).

About 6 months ago I had an opportunity to play with this approach in earnest, and realized we can speed it up a great deal. This has kept coming up in conversation ever since, so I've decided to write up an article here.

In my [bound](http://hackage.haskell.org/package/bound) library I exploit the fact that monads are about substitution to make a monad transformer that manages substitution for me.

Here I'm going to take a more coupled approach.

To have a type system with enough complexity to be worth examining, I'll adapt Dan Doel's [UPTS](http://hub.darcs.net/dolio/upts), which is a pure type system with universe polymorphism. I won't finish the implementation here, but from where we get it should be obvious how to finish the job.

Unlike Axelsson and Claessen I'm not going to bother to abstract over my name representation.

To avoid losing the original name from the source, we'll just track names as strings with an integer counting the number of times it has been 'primed'. The name is purely for expository purposes, the real variable identifier is the number. We'll follow the Axelsson and Claessen convention of having the identifier assigned to each binder be larger than any one bound inside of it. If you don't need he original source names you can cull them from the representation, but they can be useful if you are representing a syntax tree for something you parsed and/or that you plan to pretty print later.

```haskell
data Name = Name String Int
   deriving (Show,Read)

hint :: Name -> String
hint (Name n _) = n

nameId :: Name -> Int
nameId (Name _ i) = i

instance Eq Name where
  (==) = (==) `on` nameId

instance Ord Name where
  compare = compare `on` nameId

prime :: String -> Int -> Name
prime n i = Name n (i + 1)
```

So what is the language I want to work with?

```haskell
type Level = Int

data Constant
  = Level
  | LevelLiteral {-# UNPACK #-} !Level
  | Omega
  deriving (Eq,Ord,Show,Read,Typeable)

data Term a
  = Free a
  | Bound {-# UNPACK #-} !Name
  | Constant !Constant
  | Term a :+ {-# UNPACK #-} !Level
  | Max  [Term a]
  | Type !(Term a)
  | Lam   {-# UNPACK #-} !Name !(Term a) !(Term a)
  | Pi    {-# UNPACK #-} !Name !(Term a) !(Term a)
  | Sigma {-# UNPACK #-} !Name !(Term a) !(Term a)
  | App !(Term a) !(Term a)
  | Fst !(Term a)
  | Snd !(Term a)
  | Pair !(Term a) !(Term a) !(Term a)
  deriving (Show,Read,Eq,Ord,Functor,Foldable,Traversable,Typeable)
```

That is perhaps a bit paranoid about remaining strict, but it seemed like a good idea at the time.

We can define capture avoiding substitution on terms:

```haskell
subst :: Eq a => a -> Term a -> Term a -> Term a
subst a x y = y >>= \a' ->
  if a == a'
    then x
    else return a'
```

Now we finally need to implement Axelsson and Claessen's circular programming trick. Here we'll abstract over terms that allow us to find the highest bound value within them:

```haskell
class Bindable t where
  bound :: t -> Int
```

and instantiate it for our `Term` type

```haskell
instance Bindable (Term a) where
  bound Free{}        = 0
  bound Bound{}       = 0 -- intentional!
  bound Constant{}    = 0
  bound (a :+ _)      = bound a
  bound (Max xs)      = foldr (\a r -> bound a `max` r) 0 xs
  bound (Type t)      = bound t
  bound (Lam b t _)   = nameId b `max` bound t
  bound (Pi b t _)    = nameId b `max` bound t
  bound (Sigma b t _) = nameId b `max` bound t
  bound (App x y)     = bound x `max`  bound y
  bound (Fst t)       = bound t
  bound (Snd t)       = bound t
  bound (Pair t x y)  = bound t `max` bound x `max` bound y
```

As in the original pearl we avoid traversing into the body of the binders, hence the \_'s in the code above.

Now we can abstract over the pattern used to create a binder in the functional pearl, since we have multiple binder types in this syntax tree, and the code would get repetitive.

```haskell
binder :: Bindable t =>
  (Name -> t) ->
  (Name -> t -> r) ->
  String -> (t -> t) -> r
binder bd c n e = c b body where
  body = e (bd b)
  b = prime n (bound body)

lam, pi, sigma :: String -> Term a -> (Term a -> Term a) -> Term a
lam s t   = binder Bound (`Lam` t) s
pi s t    = binder Bound (`Pi` t) s
sigma s t = binder Bound (`Sigma` t) s
```

We may not always want to give names to the variables we capture, so let's define:

```haskell
lam_, pi_, sigma_ :: Term a -> (Term a -> Term a) -> Term a
lam_   = lam "_"
pi_    = pi "_"
sigma_ = sigma "_"
```

Now, here's the interesting part. The problem with Axelsson and Claessen's original trick is that every substitution is being handled separately. This means that if you were to write a monad for doing substitution with it, it'd actually be quite slow. You have to walk the syntax tree over and over and over.

We can fuse these together by making a single pass:

```haskell
instantiate :: Name -> t -> IntMap t -> IntMap t
instantiate = IntMap.insert . nameId

rebind :: IntMap (Term b) -> Term a -> (a -> Term b) -> Term b
rebind env xs0 f = go xs0 where
  go = \case
    Free a       -> f a
    Bound b      -> env IntMap.! nameId b
    Constant c   -> Constant c
    m :+ n       -> go m :+ n
    Type t       -> Type (go t)
    Max xs       -> Max (fmap go xs)
    Lam b t e    -> lam   (hint b) (go t) $ \v ->
      rebind (instantiate b v env) e f
    Pi b t e     -> pi    (hint b) (go t) $ \v ->
      rebind (instantiate b v env) e f
    Sigma b t e  -> sigma (hint b) (go t) $ \v ->
      rebind (instantiate b v env) e f
    App x y      -> App (go x) (go y)
    Fst x        -> Fst (go x)
    Snd x        -> Snd (go x)
    Pair t x y   -> Pair (go t) (go x) (go y)
```

Note that the `Lam`, `Pi` and `Sigma` cases just extend the current environment.

With that now we can upgrade the pearl's encoding to allow for an actual Monad in the same sense as `bound`.

```haskell
instance Applicative Term where
  pure = Free
  (< *>) = ap

instance Monad Term where
  return = Free
  (>>=) = rebind IntMap.empty
```

To show that we can work with this syntax tree representation, let's write an evaluator from it to weak head normal form:

First we'll need some helpers:

```haskell
apply :: Term a -> [Term a] -> Term a
apply = foldl App

rwhnf :: IntMap (Term a) ->
  [Term a] -> Term a -> Term a
rwhnf env stk     (App f x)
  = rwhnf env (rebind env x Free:stk) f
rwhnf env (x:stk) (Lam b _ e)
  = rwhnf (instantiate b x env) stk e
rwhnf env stk (Fst e)
  = case rwhnf env [] e of
  Pair _ e' _ -> rwhnf env stk e'
  e'          -> Fst e'
rwhnf env stk (Snd e)
  = case rwhnf env [] e of
  Pair _ _ e' -> rwhnf env stk e'
  e'          -> Snd e'
rwhnf env stk e
  = apply (rebind env e Free) stk
```

Then we can start off the `whnf` by calling our helper with an initial starting environment:

```haskell
whnf :: Term a -> Term a
whnf = rwhnf IntMap.empty []
```

So what have we given up? Well, `bound` automatically lets you compare terms for alpha equivalence by quotienting out the placement of "F" terms in the syntax tree. Here we have a problem in that the identifiers we get assigned aren't necessarily canonical.

But we can get the same identifiers out by just using the monad above:

```haskell
alphaEq :: Eq a => Term a -> Term a -> Bool
alphaEq = (==) `on` liftM id
```

It makes me a bit uncomfortable that our monad is only up to alpha equivalence and that `liftM` swaps out the identifiers used throughout the entire syntax tree, and we've also lost the ironclad protection against exotic terms.

But overall, this is a much faster version of Axelsson and Claessen's trick and it can be used as a drop-in replacement for something like `bound` in many cases, and unlike bound, it lets you use HOAS-style syntax for constructing `lam`, `pi` and `sigma` terms.

With pattern synonyms you can prevent the user from doing bad things as well. Once 7.10 ships you'd be able to use a bidirectional pattern synonym for `Pi`, `Sigma` and `Lam` to hide the real constructors behind. I'm not yet sure of the "best practices" in this area.

Here's the code all in one place:

\[[Download Circular.hs](http://comonad.com/reader/wp-content/uploads/2014/12/Circular.hs)\]

Happy Holidays,  
\-Edward
