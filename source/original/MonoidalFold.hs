{-# LANGUAGE GADTs, GeneralizedNewtypeDeriving, ScopedTypeVariables, FlexibleContexts, UndecidableInstances #-}

import Control.Comonad
import Data.Bits
import Data.Foldable as Foldable
import Data.Monoid
import Data.Profunctor.Unsafe
import Data.Proxy
import Data.Reflection
import Data.Array.Unboxed
import Data.Word

newtype GF = GF { runGF :: Word32 } deriving (Eq,Show,Read,Bits,IArray UArray)

-- | @x^32 + x^26 + x^23 + x^22 + x^16 + x^12 + x^11 + x^10 + x^8 + x^7 + x^5 + x^4 + x^2 + x + 1@
poly :: GF
poly = GF 0xedb88320 -- the polynomial we're working modulo in GF(2^32) for CRC32.

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

-- | @x^1@
x :: GF
x = GF 0x40000000

-- | @x^31 + x^30 + ... + x + 1@
ones :: GF
ones = GF 0xffffffff

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

data M a b where
  M :: (r -> b) -> (a -> r) -> (r -> r -> r) -> r -> M a b

instance Functor (M a) where
  fmap f (M k h m z) = M (f.k) h m z

instance Profunctor M where
  dimap f g (M k h m z) = M (g.k) (h.f) m z

instance Comonad (M a) where
  extract (M k _ _ z) = k z
  duplicate (M k h m z) = M (\n -> M (k . m n) h m z) h m z

newtype N a s = N { runN :: a }

instance Reifies s (a -> a -> a, a) => Monoid (N a s) where
  mempty = N $ snd $ reflect (Proxy :: Proxy s)
  mappend (N a) (N b) = N $ fst (reflect (Proxy :: Proxy s)) a b

-- show
runM :: Foldable f => M a b -> f a -> b
runM (M k h m (z :: m)) s = reify (m, z) $
    \ (_ :: Proxy s) -> k $ runN (foldMap (N #. h) s :: N m s)

runR :: Foldable f => M a b -> f a -> b
runR (M k h m z) xs = k (Foldable.foldr (m.h) z xs)

runL :: Foldable f => M a b -> f a -> b
runL (M k h m z) xs = k (Foldable.foldl' (\r -> m r . h) z xs)

crc32 :: M Word8 Word32
crc32 = M runCRC byte mappend mempty

main = print $ runM crc32 [0x12,0x34]
-- /show
