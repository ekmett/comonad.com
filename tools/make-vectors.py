"""Independent CRC-32 fixtures using Python's zlib, never the demo algorithm."""
import json
from pathlib import Path
import random
import zlib

rng = random.Random(0x20130911)
inputs = [b'', b'123456789', b'12345689', b'\0', b'\0' * 256,
          bytes(range(256)), bytes([255]) * 65, 'λ → Haskell 🦀'.encode()]
inputs += [rng.randbytes(n) for n in [1, 2, 3, 7, 8, 9, 15, 31, 32, 63, 64, 127, 255, 511, 1024, 4096]]
destination = Path(__file__).resolve().parent.parent / 'tests/vectors.json'
destination.write_text(json.dumps([{'bytes': list(x), 'crc': zlib.crc32(x)} for x in inputs]) + '\n')
