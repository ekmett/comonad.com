module MortonDemo (demo, key) where

import Data.Bits
import Data.Word
import Data.List (nub, sortOn)
import DemoJSON

-- The article's 64-bit shuffle, with the first coordinate in the high half.
-- Thus first-coordinate bits occupy odd positions, second-coordinate bits even.
shuffle :: Word64 -> Word64
shuffle k0 = k5 where
  k1 = shiftL (k0 .&. 0x00000000FFFF0000) 16 .|. shiftR k0 16 .&. 0x00000000FFFF0000 .|. k0 .&. 0xFFFF00000000FFFF
  k2 = shiftL (k1 .&. 0x0000FF000000FF00) 8 .|. shiftR k1 8 .&. 0x0000FF000000FF00 .|. k1 .&. 0xFF0000FFFF0000FF
  k3 = shiftL (k2 .&. 0x00F000F000F000F0) 4 .|. shiftR k2 4 .&. 0x00F000F000F000F0 .|. k2 .&. 0xF00FF00FF00FF00F
  k4 = shiftL (k3 .&. 0x0C0C0C0C0C0C0C0C) 2 .|. shiftR k3 2 .&. 0x0C0C0C0C0C0C0C0C .|. k3 .&. 0xC3C3C3C3C3C3C3C3
  k5 = shiftL (k4 .&. 0x2222222222222222) 1 .|. shiftR k4 1 .&. 0x2222222222222222 .|. k4 .&. 0x9999999999999999

key :: Int -> Int -> Int
key i j = fromIntegral (shuffle (shiftL (fromIntegral i) 32 .|. fromIntegral j))

demo :: Int -> Int -> Int -> J
demo x0 y0 block0 = Obj [("x",n x),("y",n y),("key",n (key x y)),("rowKey",n (y*8+x)),("xBits",Str (bits x)),("yBits",Str (bits y)),("keyBits",Str [if testBit (key x y) i then '1' else '0' | i <- [5,4..0]]),("path",Arr (map point (sortOn (uncurry key) cells))),("rowPath",Arr (map point cells)),("region",Arr (map point region)),("mortonBlocks",n (blocks (uncurry key))),("rowBlocks",n (blocks (\(a,b)->b*8+a)))]
  where
    x = max 0 (min 7 x0); y = max 0 (min 7 y0); block = max 1 (min 64 block0)
    n = Num . fromIntegral
    bits a = [if testBit a i then '1' else '0' | i <- [2,1,0]]
    cells = [(a,b) | b <- [0..7], a <- [0..7]]
    region = [(a,b) | b <- [min 6 y..min 6 y+1], a <- [min 6 x..min 6 x+1]]
    point (a,b) = Arr [n a,n b]
    blocks index = length (nub [index p `div` block | p <- region])
