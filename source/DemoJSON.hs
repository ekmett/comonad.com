module DemoJSON (J(..), encode) where

import Data.Char (ord)
import Data.List (intercalate)
import Numeric (showHex)

data J = Obj [(String,J)] | Arr [J] | Str String | Num Double | Boolean Bool

encode :: J -> String
encode (Obj pairs) = "{" ++ intercalate "," [quote k ++ ":" ++ encode v | (k,v) <- pairs] ++ "}"
encode (Arr xs) = "[" ++ intercalate "," (map encode xs) ++ "]"
encode (Str s) = quote s
encode (Num n) | isNaN n || isInfinite n = "null"
               | otherwise = show n
encode (Boolean b) = if b then "true" else "false"

quote :: String -> String
quote s = '"' : concatMap escape s ++ "\""
  where
    escape '"' = "\\\""
    escape '\\' = "\\\\"
    escape c | ord c < 32 || ord c > 126 = let h = showHex (ord c) "" in "\\u" ++ replicate (4-length h) '0' ++ h
             | otherwise = [c]
