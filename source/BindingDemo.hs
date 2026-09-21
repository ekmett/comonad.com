{-# LANGUAGE DeriveFunctor #-}
-- A small self-contained Scope/Var encoding from the article's derivation.
-- This is companion code, not a vendored or installed version of bound.
module BindingDemo (demo) where

import Control.Monad (ap, liftM)
import Data.List (nub, sort)
import DemoJSON

data Var b a = B b | F a deriving Functor
newtype Scope b f a = Scope (f (Var b a))
data Exp a = V a | App (Exp a) (Exp a) | Lam (Scope () Exp a)

instance Functor Exp where fmap = liftM
instance Applicative Exp where pure = V; (<*>) = ap
instance Monad Exp where
  V a >>= f = f a
  App a b >>= f = App (a >>= f) (b >>= f)
  Lam (Scope body) >>= f = Lam (Scope (body >>= go))
    where go (B ()) = pure (B ())
          go (F a) = F <$> f a

abstract1 :: Eq a => a -> Exp a -> Scope () Exp a
abstract1 a = Scope . fmap (\b -> if a == b then B () else F b)

instantiate1 :: Exp a -> Scope () Exp a -> Exp a
instantiate1 value (Scope body) = body >>= \v -> case v of B () -> value; F a -> V a

free :: Exp a -> [a]
free (V a) = [a]
free (App a b) = free a ++ free b
free (Lam (Scope body)) = [a | F a <- free body]

data Named = NV String | NA Named Named | NL String Named

scoped :: Named -> Exp String
scoped (NV a) = V a
scoped (NA a b) = App (scoped a) (scoped b)
scoped (NL a b) = Lam (abstract1 a (scoped b))

-- Deliberately incorrect: respects shadowing but fails to rename binders
-- that capture free variables of the replacement.
naive :: String -> Named -> Named -> Named
naive name value (NV a) = if name == a then value else NV a
naive name value (NA a b) = NA (naive name value a) (naive name value b)
naive name value term@(NL a b) = if name == a then term else NL a (naive name value b)

named :: String -> [String] -> Exp String -> Named
named _ _ (V a) = NV a
named preferred used (App a b) = NA (named preferred used a) (named preferred used b)
named preferred used term@(Lam body) = NL fresh (named preferred (fresh:used) (instantiate1 (V fresh) body))
  where fresh = choose preferred
        choose candidate | candidate `elem` (used ++ free term) = choose (candidate ++ "'")
                         | otherwise = candidate

structure :: (a -> String) -> Exp a -> String
structure f (V a) = f a
structure f (App a b) = "App (" ++ structure f a ++ ") (" ++ structure f b ++ ")"
structure f (Lam (Scope body)) = "Lam (" ++ structure step body ++ ")"
  where step (B ()) = "B ()"
        step (F a) = "F (" ++ f a ++ ")"

termJSON :: Named -> J
termJSON term = Obj [("tokens", Arr (tokens [] term)), ("free", Arr (map Str (sort (nub (free (scoped term)))))), ("ast", ast term)]
  where
    token kind txt = Obj [("kind",Str kind),("text",Str txt)]
    tokens env (NV a) = [token (if a `elem` env then "bound" else "free") a]
    tokens env (NA a b) = [token "syntax" "("] ++ tokens env a ++ [token "syntax" " "] ++ tokens env b ++ [token "syntax" ")"]
    tokens env (NL a b) = [token "syntax" "λ",token "binder" a,token "syntax" ". "] ++ tokens (a:env) b
    ast (NV a) = Arr [Str "var",Str a]
    ast (NA a b) = Arr [Str "app",ast a,ast b]
    ast (NL a b) = Arr [Str "lam",Str a,ast b]

demo :: Int -> Int -> J
demo preset spelling = Obj [("original",termJSON original),("replacement",termJSON replacement),("variable",Str variable),("naive",termJSON wrong),("safe",termJSON correct),("scope",Str (structure show result))]
  where
    (original,variable,replacement) = case preset of
      1 -> (NL "y" (NV "z"),"z",NL "x" (NV "y"))
      2 -> (NL "x" (NA (NV "y") (NV "x")),"y",NV "x")
      3 -> (NL "y" (NV "y"),"y",NV "x")
      _ -> (NL "x" (NV "y"),"y",NV "x")
    wrong = naive variable replacement original
    result = scoped original >>= \a -> if a == variable then scoped replacement else V a
    preferred = case spelling of 1 -> "z"; 2 -> "u"; _ -> "x"
    correct = named preferred [] result
