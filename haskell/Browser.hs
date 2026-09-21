{-# LANGUAGE ForeignFunctionInterface #-}
-- This adapter is compiled by GHC to WebAssembly, not translated to JavaScript.
module Browser where

import CRC
import Data.Word
import Foreign.Marshal.Array (peekArray)
import Foreign.Ptr (Ptr)

foreign export ccall crc_direct :: Ptr Word8 -> Int -> IO Word32
foreign export ccall crc_remainder :: Ptr Word8 -> Int -> IO Word32
foreign export ccall crc_factor :: Int -> Word32
foreign export ccall crc_multiply :: Word32 -> Word32 -> Word32
foreign export ccall crc_combine :: Word32 -> Word32 -> Word32 -> Word32
foreign export ccall crc_finish :: Word32 -> Word32 -> Word32

crc_direct :: Ptr Word8 -> Int -> IO Word32
crc_direct ptr len = direct <$> peekArray len ptr

crc_remainder :: Ptr Word8 -> Int -> IO Word32
crc_remainder ptr len = remainder . summarize <$> peekArray len ptr

crc_factor :: Int -> Word32
crc_factor = shiftFactor

crc_multiply :: Word32 -> Word32 -> Word32
crc_multiply = multiply

crc_combine :: Word32 -> Word32 -> Word32 -> Word32
crc_combine p q n = remainder (combine (Summary p 0) (Summary q n))

crc_finish :: Word32 -> Word32 -> Word32
crc_finish p m = finish (Summary p m)
