-- A tiny inspectable reverse-mode tape, not a trace from the ad package.
module ADDemo (demo) where

import qualified Data.IntMap.Strict as M
import DemoJSON

data Op = Input String Double | Times Int Int | Sine Int | Plus Int Int

demo :: Double -> Double -> J
demo x y = Obj [("nodes",Arr nodes),("steps",Arr (forward ++ [seed] ++ reverseSteps)),("gradient",Arr [Num (get 0 final),Num (get 1 final)])]
  where
    tape = [Input "x" x,Input "y" y,Times 0 1,Sine 0,Plus 2 3]
    values = foldl eval M.empty (zip [0..] tape)
    get i m = M.findWithDefault 0 i m
    eval m (i,op) = M.insert i (case op of Input _ v -> v; Times a b -> get a m * get b m; Sine a -> sin (get a m); Plus a b -> get a m + get b m) m
    parents op = case op of Input _ _ -> []; Times a b -> [a,b]; Sine a -> [a]; Plus a b -> [a,b]
    label op = case op of Input a _ -> a; Times _ _ -> "×"; Sine _ -> "sin"; Plus _ _ -> "+"
    nodes = [Obj [("id",Num (fromIntegral i)),("label",Str (label op)),("value",Num (get i values)),("parents",Arr (map (Num . fromIntegral) (parents op)))] | (i,op) <- zip [0..] tape]
    frame :: String -> Int -> String -> M.IntMap Double -> J
    frame phase i message adj = Obj [("phase",Str phase),("active",Num (fromIntegral i)),("message",Str message),("adjoints",Arr [Num (get j adj) | j <- [0..4]])]
    forward = [frame "forward" i ("Evaluate " ++ label op ++ ".") M.empty | (i,op) <- zip [0..] tape]
    initial = M.singleton 4 1
    seed = frame "reverse" 4 "Seed the output sensitivity with 1." initial
    push i adj = case tape !! i of
      Times a b -> add b (get i adj * get a values) (add a (get i adj * get b values) adj)
      Sine a -> add a (get i adj * cos (get a values)) adj
      Plus a b -> add b (get i adj) (add a (get i adj) adj)
      Input _ _ -> adj
    add = M.insertWith (+)
    states = drop 1 (scanl (flip push) initial [4,3,2])
    messages = ["Addition sends its sensitivity to both inputs.","sin contributes cos(x) to x.","Multiplication contributes y to x and x to y. Contributions at x add."]
    reverseSteps = zipWith3 (\i msg adj -> frame "reverse" i msg adj) [4,3,2] messages states
    final = last states
