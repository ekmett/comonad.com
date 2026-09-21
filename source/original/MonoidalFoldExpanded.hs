{-# LANGUAGE GADTs, GeneralizedNewtypeDeriving, RankNTypes, ScopedTypeVariables, StandaloneDeriving, MultiParamTypeClasses, FlexibleContexts #-}
{-# OPTIONS_GHC -fno-warn-type-defaults #-}

import Control.Comonad
import Data.Bits
import Data.Foldable as Foldable
import Data.Monoid
import Data.Profunctor
import Data.Proxy
import Data.Reflection
import Data.Array.Unboxed
import Data.Word

newtype GF a s = GF { runGF :: a } deriving (Eq,Show,Read,Bits)

deriving instance IArray UArray a => IArray UArray (GF a s)

-- | compute x * p(x)
xtimes :: (Integral a, Bits a, Reifies s a) => GF a s -> GF a s
xtimes c = unsafeShiftR c 1 + if testBit c 0 then GF (reflect c) else 0
{-# INLINE xtimes #-}

instance (Integral a, Bits a, Reifies s a) => Num (GF a s) where
  (+) = xor
  (-) = xor
  _ * 0 = 0
  a * b = xtimes a * unsafeShiftL b 1 + if testBit b (bitSize b - 1) then a else 0
  negate = id
  abs = id
  signum = fromIntegral . signum . runGF
  fromInteger i
    | odd i     = GF (bit (bitSize (undefined :: a) - 1)) -- x^0
    | otherwise = GF 0                     -- 0

-- | @x^1@
x :: forall a s. Bits a => GF a s
x = GF (bit (bitSize (undefined :: a) - 2))
{-# INLINE x #-}

data CRC a = CRC !a !a deriving (Eq,Read,Show)

instance Num a => Monoid (CRC a) where
  CRC p m `mappend` CRC q n = CRC (p*n+q) (m*n)
  mempty = CRC 0 1

crc :: forall a. (Integral a, Bits a, IArray UArray a) => a -> a -> a -> M Word8 a
crc _INIT _FINAL poly = reify poly $ \(_ :: Proxy s) ->
  let crcs :: UArray Word8 (GF a s)
      crcs = listArray (0,255) $ map (xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.xtimes.GF) [0..255]
      k (CRC p m) = runGF (GF _INIT * m + p + GF _FINAL)
      h a = CRC (crcs ! a) (x^8)
  in M k h mappend mempty
{-# INLINE crc #-}

-- | @x^32+x^26+x^23+x^22+x^16+x^12+x^11+x^10+x^8+x^7+x^5+x^4+x^2+x+1@
crc32 :: M Word8 Word32
crc32 = crc 0xffffffff 0xffffffff 0xedb88320

crc64_ecma182 :: M Word8 Word64
crc64_ecma182 = crc (-1) (-1) 0xC96C5795D7870F42

crc8 :: M Word8 Word8
crc8 = crc 0xff 0xff 0xab

crc8_sae :: M Word8 Word8
crc8_sae = crc 0xff 0xff 0xb8

data M a b where
  M :: (r -> b) -> (a -> r) -> (r -> r -> r) -> r -> M a b

instance Functor (M a) where
  fmap f (M k h m z) = M (f.k) h m z

instance Profunctor M where
  dimap f g (M k h m z) = M (g.k) (h.f) m z

instance Comonad (M a) where
  extract (M k _ _ z) = k z
  duplicate (M k h m z) = M (\n -> M (k . m n) h m z) h m z

runM :: Foldable f => M a b -> f a -> b
runM (M k h m z) xs = k (Foldable.foldr (m.h) z xs)

main = print $ runM crc32 [0x12,0x34]
