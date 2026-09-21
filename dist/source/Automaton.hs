module Automaton (step) where

import Data.Bits (testBit)
import Data.Word (Word8)

-- One generation, discarding the two boundary cells. Begin with enough padding
-- to compute the displayed window exactly on the infinite integer line.
-- Wolfram's bit order is left * 4 + centre * 2 + right, as in the article.
step :: Word8 -> [Word8] -> [Word8]
step rule cells = zipWith3 apply cells (drop 1 cells) (drop 2 cells)
  where
    apply l c r = if testBit rule (fromIntegral (4*l + 2*c + r)) then 1 else 0
