{-# LANGUAGE DeriveFunctor, DeriveFoldable, DeriveTraversable, DeriveDataTypeable, LambdaCase, PatternSynonyms #-}
module Hom where

import Control.Applicative
import Control.Monad (ap, liftM)
import Data.Foldable hiding (foldr, foldl)
import Data.Function (on)
import Data.IntMap (IntMap)
import qualified Data.IntMap as IntMap
import Data.Traversable
import Data.Typeable
import Prelude hiding (pi)

--------------------------------------------------------------------------------
-- * Circular Substitution
--------------------------------------------------------------------------------

data Name = Name String Int deriving (Show,Read)

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

class Bindable t where
  bound :: t -> Int

binder :: Bindable t => (Name -> t) -> (Name -> t -> r) -> String -> (t -> t) -> r
binder bd c n e = c b body where
  body = e (bd b)
  b = prime n (bound body)

instantiate :: Name -> t -> IntMap t -> IntMap t
instantiate = IntMap.insert . nameId

--------------------------------------------------------------------------------
-- * UPTS
--------------------------------------------------------------------------------

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

subst :: Eq a => a -> Term a -> Term a -> Term a
subst a x y = x >>= \a' -> if a == a' then x else return a'

alphaEq :: Eq a => Term a -> Term a -> Bool
alphaEq = (==) `on` liftM id

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

lam, pi, sigma :: String -> Term a -> (Term a -> Term a) -> Term a
lam s t   = binder Bound (`Lam` t) s
pi s t    = binder Bound (`Pi` t) s
sigma s t = binder Bound (`Sigma` t) s

lam_, pi_, sigma_ :: Term a -> (Term a -> Term a) -> Term a
lam_   = lam "_"
pi_    = pi "_"
sigma_ = sigma "_"

rebind :: IntMap (Term b) -> Term a -> (a -> Term b) -> Term b
rebind env xs0 f = go xs0 where
  go = \case 
    Free a       -> f a
    Bound b      -> env IntMap.! nameId b
    Constant c   -> Constant c
    m :+ n       -> go m :+ n
    Type t       -> Type (go t)
    Max xs       -> Max (go <$> xs)
    Lam b t e    -> lam   (hint b) (go t) $ \v -> rebind (instantiate b v env) e f
    Pi b t e     -> pi    (hint b) (go t) $ \v -> rebind (instantiate b v env) e f
    Sigma b t e  -> sigma (hint b) (go t) $ \v -> rebind (instantiate b v env) e f
    App x y      -> App (go x) (go y)
    Fst x        -> Fst (go x)
    Snd x        -> Snd (go x)
    Pair t x y   -> Pair (go t) (go x) (go y)

instance Applicative Term where
  pure = Free
  (<*>) = ap

instance Monad Term where
  return = Free
  (>>=) = rebind IntMap.empty

apply :: Term a -> [Term a] -> Term a
apply = foldl App

rwhnf :: IntMap (Term a) -> [Term a] -> Term a -> Term a
rwhnf env stk     (App f x)   = rwhnf env (rebind env x Free:stk) f
rwhnf env (x:stk) (Lam b _ e) = rwhnf (instantiate b x env) stk e
rwhnf env stk (Fst e) = case rwhnf env [] e of
  Pair _ e' _ -> rwhnf env stk e'
  e'          -> Fst e'
rwhnf env stk (Snd e) = case rwhnf env [] e of
  Pair _ _ e' -> rwhnf env stk e'
  e'          -> Snd e'
rwhnf env stk e = apply (rebind env e Free) stk

whnf :: Term a -> Term a
whnf = rwhnf IntMap.empty []
