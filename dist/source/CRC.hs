{-# LANGUAGE BangPatterns #-}
-- Adapted from Edward Kmett, Parallel and Incremental CRCs (2013).
-- https://www.schoolofhaskell.com/user/edwardk/parallel-crc
module CRC
  ( Summary(..), multiply, summarize, combine, finish, direct, shiftFactor ) where

import Data.Bits
import Data.Word

-- Reflected polynomial representation: 0x80000000 represents one.
-- Arithmetic is in GF(2)[x] modulo the CRC-32 polynomial.
one :: Word32
one = 0x80000000

xtimes :: Word32 -> Word32
xtimes a = shiftR a 1 `xor` if testBit a 0 then 0xedb88320 else 0

multiply :: Word32 -> Word32 -> Word32
multiply a b = go a b 0 where
  go !_ 0 !acc = acc
  go !p !q !acc = go (xtimes p) (shiftL q 1)
    (if testBit q 31 then acc `xor` p else acc)

shiftFactor :: Int -> Word32
shiftFactor len = power 0x00800000 len one where
  -- 0x00800000 = x^8 in the reflected representation.
  power !_ 0 !acc = acc
  power !x !n !acc = power (multiply x x) (n `div` 2)
    (if odd n then multiply acc x else acc)

data Summary = Summary
  { remainder :: !Word32
  , factor :: !Word32
  } deriving (Eq, Show)

instance Semigroup Summary where
  (<>) = combine

instance Monoid Summary where
  mempty = Summary 0 one

combine :: Summary -> Summary -> Summary
combine (Summary p m) (Summary q n) =
  Summary (multiply p n `xor` q) (multiply m n)

byteStep :: Word32 -> Word8 -> Word32
byteStep r b = times 8 (r `xor` fromIntegral b) where
  times :: Int -> Word32 -> Word32
  times 0 !a = a
  times n !a = times (n - 1) (xtimes a)

summarize :: [Word8] -> Summary
summarize bytes = Summary (foldl' byteStep 0 bytes) (shiftFactor (length bytes))

finish :: Summary -> Word32
finish (Summary p m) = multiply 0xffffffff m `xor` p `xor` 0xffffffff

direct :: [Word8] -> Word32
direct = complement . foldl' byteStep 0xffffffff
