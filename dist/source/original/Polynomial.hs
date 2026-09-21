{-# LANGUAGE GeneralizedNewtypeDeriving #-}
import Data.Bits
import Data.Word

-- show
newtype GF = GF { runGF :: Word32 } deriving (Eq,Show,Read,Bits)

poly :: GF
poly = GF 0xedb88320 -- -- x^32+x^26+x^23+x^22+x^16+x^12+x^11+x^10+x^8+x^7+x^5+x^4+x^2+x+1

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
-- /show

main = putStrLn "It compiles, so it is obviously correct."
