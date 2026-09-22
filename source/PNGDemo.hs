{-# LANGUAGE BangPatterns #-}
-- Browser companions to Cellular Automata II/III and Mandelbrot.
-- Rules and escape counts follow the articles. PNG uses stored DEFLATE blocks
-- instead of depending on zlib; CRC-32, Adler-32 and Adam7 are real PNG encoding.
module PNGDemo (demo) where

import qualified Automaton
import qualified CRC
import qualified Data.IntMap.Strict as M
import Data.Bits
import Data.Char (ord)
import Data.Word
import DemoJSON
import Numeric (showHex)

be32 :: Word32 -> [Word8]
be32 n = [fromIntegral (shiftR n k) | k <- [24,16,8,0]]

chunk :: String -> [Word8] -> [Word8]
chunk name bytes = be32 (fromIntegral (length bytes)) ++ tag ++ bytes ++ be32 (CRC.direct (tag ++ bytes))
  where tag = map (fromIntegral . ord) name

zlib :: [Word8] -> [Word8]
zlib bytes = [0x78,0x01] ++ blocks bytes ++ be32 (shiftL b 16 .|. a)
  where
    (a,b) = foldl' (\(!x,!y) v -> let x' = (x + fromIntegral v) `mod` 65521 in (x', (y+x') `mod` 65521)) (1,0) bytes
    blocks xs = let (front,rest) = splitAt 65535 xs
                    n = length front
                    lo = fromIntegral n
                    hi = fromIntegral (shiftR n 8)
                in [if null rest then 1 else 0,lo,hi,complement lo,complement hi] ++ front ++ if null rest then [] else blocks rest

passes :: [(Int,Int,Int,Int)]
passes = [(0,0,8,8),(4,0,8,8),(0,4,4,8),(2,0,4,4),(0,2,2,4),(1,0,2,2),(0,1,1,2)]

png :: Int -> Int -> Bool -> [[Word8]] -> [Word8]
png w h interlaced rows = [137,80,78,71,13,10,26,10] ++ chunk "IHDR" header ++ chunk "IDAT" (zlib scanlines) ++ chunk "IEND" []
  where
    header = be32 (fromIntegral w) ++ be32 (fromIntegral h) ++ [8,0,0,0,if interlaced then 1 else 0]
    pixels = M.fromDistinctAscList (zip [0..] (map (M.fromDistinctAscList . zip [0..]) rows))
    scanlines = concat [0 : [pixels M.! y M.! x | x <- [sx,sx+dx..w-1]] | (sx,sy,dx,dy) <- if interlaced then passes else [(0,0,1,1)], sx < w, sy < h, y <- [sy,sy+dy..h-1]]

-- Compute the integer-line picture with enough padding, then shrink each step.
flatRows :: Int -> Int -> Int -> Int -> [[Word8]]
flatRows r w h seed = take h (go initial)
  where
    initial = [if x == seed then 1 else 0 | x <- [-h..w+h-1]]
    go cells = let margin = (length cells-w) `div` 2
               in take w (drop margin cells) : go (Automaton.step (fromIntegral r) cells)

-- Exactly the action in Part III: left/right wrap; staying keeps its index.
-- The initial world is (==0), not a periodically repeated initial seed.
moduloRows :: Int -> Int -> Int -> Int -> [[Word8]]
moduloRows r w h period = map window (take h (iterate next initial))
  where
    start = negate (w `div` 2)
    keys = [start..max (start+w-1) (period-1)]
    initial = M.fromDistinctAscList [(x,if x==0 then 1 else 0) | x <- keys]
    next cells = M.mapWithKey (\x c -> if testBit r (4 * (cells M.! ((x-1) `mod` period)) + 2*c + cells M.! ((x+1) `mod` period)) then 1 else 0) cells
    window cells = [fromIntegral (cells M.! x) | x <- [start..start+w-1]]

escape :: Int -> Double -> Double -> Int
escape limit cr ci = go 0 0 0
  where
    go !k !r !i
      | k >= limit = 0
      | r*r+i*i > 4 = k*255 `div` limit
      | otherwise = go (k+1) (r*r-i*i+cr) (2*r*i+ci)

hexByte :: Word8 -> String
hexByte b = let s=showHex b "" in if b<16 then '0':s else s

demo :: Int -> Int -> Int -> Int -> Int -> Double -> Double -> Double -> J
demo kind parameter width height option cx cy spanX = Obj
  [("width",Num (fromIntegral w)),("height",Num (fromIntegral h)),("pngHex",Str (concatMap hexByte bytes)),
   ("firstRow",Str (rowText (case rows of first:_ -> first; [] -> []))),("lastRow",Str (rowText (last rows))),
   ("darkPixels",Num (fromIntegral (length (filter (<128) (concat rows))))) ]
  where
    w = max 1 (min 600 width)
    h = max 1 (min 400 height)
    rule = max 0 (min 255 parameter)
    generations = if kind==1 then moduloRows rule w h (max 2 (min 120 option)) else flatRows rule w h option
    rows | kind==2 = [[fromIntegral (escape (max 1 (min 512 parameter)) (cx+(fromIntegral x/fromIntegral w-0.5)*spanX) (cy+(fromIntegral y/fromIntegral h-0.5)*spanX*2/3)) | x <- [0..w-1]] | y <- [0..h-1]]
         | otherwise = map (map (\v -> if v==1 then 0 else 255)) generations
    bytes = png w h (kind==2 && option/=0) rows
    rowText = map (\v -> if v<128 then '#' else '.')
