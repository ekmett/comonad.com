{-# LANGUAGE GADTs, GeneralizedNewtypeDeriving #-}
{-# OPTIONS_GHC -fno-warn-type-defaults #-}

import Control.Comonad
import Data.Bits
import Data.Foldable as Foldable
import Data.Monoid
import Data.Profunctor
import Data.Array.Unboxed
import Data.Word

newtype GF = GF { runGF :: Word32 } deriving (Eq,Show,Read,Bits,IArray UArray)

poly :: GF
poly = GF 0xedb88320 -- x^32+x^26+x^23+x^22+x^16+x^12+x^11+x^10+x^8+x^7+x^5+x^4+x^2+x+1

-- | compute x * p(x)
xtimes :: GF -> GF
xtimes c = unsafeShiftR c 1 + if testBit c 0 then poly else 0

instance Num GF where
  (+) = xor
  (-) = xor
  _ * 0 = 0
  a * b = xtimes a * unsafeShiftL b 1 + if testBit b 31 then a else 0
  negate = id
  abs = id
  signum = fromIntegral . signum . runGF
  fromInteger i
    | odd i     = GF 0x80000000 -- x^0
    | otherwise = GF 0          -- 0

x :: GF
x = GF 0x40000000 -- x^1

ones :: GF
ones = GF 0xffffffff -- | x^31+x^30+...+x+1

data CRC32 = CRC32 {-# UNPACK #-} !GF {-# UNPACK #-} !GF deriving (Eq,Read,Show)

instance Monoid CRC32 where
  CRC32 p m `mappend` CRC32 q n = CRC32 (p*n+q) (m*n)
  mempty = CRC32 0 1

crcs :: UArray Word8 GF
crcs = listArray (0,255) $ map (xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.GF) [0..255]

runCRC :: CRC32 -> Word32
runCRC (CRC32 p m) = runGF (ones * m + p + ones)

byte :: Word8 -> CRC32
byte a = CRC32 (crcs ! a) (x^8)

main = print $ runCRC $ foldMap (byte.fromIntegral.fromEnum) "123456789"
