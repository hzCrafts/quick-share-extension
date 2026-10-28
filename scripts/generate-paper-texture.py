"""Generate the deterministic, low-contrast cotton-paper surface tile (stdlib only)."""
import random,math,zlib,struct
from pathlib import Path
rng=random.Random(874321);size=640;raw=bytearray()
for y in range(size):
 raw.append(0)
 for x in range(size):
  # Periodic broad grain makes the tile seamless; fine grain remains unobtrusive.
  broad=2*math.sin(2*math.pi*(x+y)/size)+1.5*math.sin(2*math.pi*(3*x-2*y)/size)
  grain=rng.random();v=246+grain*9+broad-(rng.random()*40 if grain<.035 else 0)
  raw.append(round(255-(255-max(0,min(255,v)))*.26))
def chunk(t,b):return struct.pack('>I',len(b))+t+b+struct.pack('>I',zlib.crc32(t+b)&0xffffffff)
png=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,0,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')
(Path(__file__).resolve().parents[1] / 'src/assets/paper-fiber.png').write_bytes(png)
print(len(png))
