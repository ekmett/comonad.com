module LCADemo (demo) where

import Control.Monad.Writer.Strict
import DemoJSON

data Tree = Tip Int | Bin Int Tree Tree
data Path = Nil | Cons Int Int Tree Path
type Trace = Writer [(Int,Int)]

root :: Tree -> Int
root (Tip a) = a
root (Bin a _ _) = a
top :: Path -> Int
top Nil = -1
top (Cons _ _ t _) = root t
size :: Path -> Int
size Nil = 0
size (Cons n _ _ _) = n
consT :: Int -> Tree -> Path -> Path
consT w t ts = Cons (w + size ts) w t ts
cons :: Int -> Path -> Path
cons k (Cons n w a (Cons _ v b rest)) | w == v = Cons (n+1) (2*w+1) (Bin k a b) rest
cons k rest = Cons (size rest+1) 1 (Tip k) rest
list :: Path -> [Int]
list Nil = []
list (Cons _ _ t ts) = tree t ++ list ts
  where tree (Tip a) = [a]; tree (Bin a l r) = a : tree l ++ tree r

keep :: Int -> Path -> Path
keep _ Nil = Nil
keep k xs@(Cons n w t ts)
  | k >= n = xs
  | k > n-w = keepT (k-n+w) w t ts
  | k == n-w = ts
  | otherwise = keep k ts
keepT :: Int -> Int -> Tree -> Path -> Path
keepT n w (Bin _ l r) ts
  | n < w2 = keepT n w2 r ts
  | n == w2 = consT w2 r ts
  | n == w-1 = consT w2 l (consT w2 r ts)
  | otherwise = keepT (n-w2) w2 l (consT w2 r ts)
  where w2 = w `div` 2
keepT _ _ _ ts = ts

equal :: Int -> Int -> Trace Bool
equal a b = tell [(a,b)] >> pure (a == b)
lcaEqual :: Path -> Path -> Trace Path
lcaEqual h@(Cons _ w x xs) (Cons _ _ y ys) = do
  same <- equal (root x) (root y)
  if same then pure h else do
    suffix <- equal (top xs) (top ys)
    if suffix then lcaT w x y ys else lcaEqual xs ys
lcaEqual _ _ = pure Nil
lcaT :: Int -> Tree -> Tree -> Path -> Trace Path
lcaT w (Bin _ la ra) (Bin _ lb rb) ts = do
  leftSame <- equal (root la) (root lb)
  if leftSame then pure (consT w2 la (consT w2 ra ts)) else do
    rightSame <- equal (root ra) (root rb)
    -- w2 is essential here: ra is a half-size subtree, not a w-size tree.
    if rightSame then lcaT w2 la lb (consT w2 ra ts) else lcaT w2 ra rb ts
  where w2 = w `div` 2
lcaT _ _ _ ts = pure ts

demo :: [Int] -> Int -> Int -> J
demo parents a b
  | null parents || length parents > 64 || head parents /= -1 || any (\(i,p)->p<0 || p>=i) (zip [1..] (tail parents)) || a<0 || b<0 || a>=length parents || b>=length parents = Obj [("error",Str "Invalid rooted tree or selected node.")]
  | otherwise = Obj [("ancestor",n (top answer)),("path",Arr (map n (list answer))),("size",n (size answer)),("comparisons",pairs comparisons),("naiveComparisons",pairs naivePairs),("digitsA",Arr (map n (digits pa))),("digitsB",Arr (map n (digits pb))),("alignedDepth",n depth)]
  where
    paths = cons 0 Nil : [cons i (paths !! p) | (i,p) <- zip [1..] (tail parents)]
    pa = paths !! a; pb = paths !! b; depth = min (size pa) (size pb)
    (answer,comparisons) = runWriter (lcaEqual (keep depth pa) (keep depth pb))
    aa = drop (size pa-depth) (list pa); bb = drop (size pb-depth) (list pb)
    untilMatch [] = []
    untilMatch (p@(x,y):rest) = p : if x==y then [] else untilMatch rest
    naivePairs = untilMatch (zip aa bb)
    n = Num . fromIntegral
    pairs ps = Arr [Arr [n x,n y] | (x,y) <- ps]
    digits Nil = []
    digits (Cons _ w _ ts) = w:digits ts
