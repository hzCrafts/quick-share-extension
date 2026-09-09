import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPng(width, height, getPixel) {
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      rawData[offset++] = Math.min(255, Math.max(0, Math.round(r)));
      rawData[offset++] = Math.min(255, Math.max(0, Math.round(g)));
      rawData[offset++] = Math.min(255, Math.max(0, Math.round(b)));
      rawData[offset++] = Math.min(255, Math.max(0, Math.round(a)));
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let c = 0xffffffff;
    for (let n = 0; n < buf.length; n++) {
      c = c ^ buf[n];
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
    }
    return c ^ 0xffffffff;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'binary');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = chunk('IHDR', ihdrData);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

// 辅助 SDF 距离函数与混合
function sdfRoundedRect(px, py, rx, ry, rw, rh, rad) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const dx = Math.abs(px - cx) - (rw / 2 - rad);
  const dy = Math.abs(py - cy) - (rh / 2 - rad);
  const ax = Math.max(dx, 0);
  const ay = Math.max(dy, 0);
  const outside = Math.sqrt(ax * ax + ay * ay);
  const inside = Math.min(Math.max(dx, dy), 0);
  return (outside + inside) - rad;
}

function sdfSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  const dist = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
  return dist;
}

function lerpColor(c1, c2, t) {
  return [
    c1[0] + (c2[0] - c1[0]) * t,
    c1[1] + (c2[1] - c1[1]) * t,
    c1[2] + (c2[2] - c1[2]) * t,
  ];
}

function blend(dst, src) {
  const sa = src[3] / 255;
  const da = (dst[3] / 255) * (1 - sa);
  const outA = sa + da;
  if (outA <= 0.0001) return [0, 0, 0, 0];
  const r = (src[0] * sa + dst[0] * da) / outA;
  const g = (src[1] * sa + dst[1] * da) / outA;
  const b = (src[2] * sa + dst[2] * da) / outA;
  return [r, g, b, outA * 255];
}

function render2AIcons(size) {
  const scale = size / 24;
  const antialias = 1.0 / scale;

  return createPng(size, size, (pixelX, pixelY) => {
    // 4x 超采样抗锯齿 (SSAA)
    const samples = [
      [0.25, 0.25],
      [0.75, 0.25],
      [0.25, 0.75],
      [0.75, 0.75],
    ];

    let totalR = 0, totalG = 0, totalB = 0, totalA = 0;

    for (const [sx, sy] of samples) {
      const nx = (pixelX + sx) / scale;
      const ny = (pixelY + sy) / scale;

      let pixelColor = [0, 0, 0, 0];

      // 1. 后层卡片: x: 2.5, y: 6.5, w: 13.5, h: 14, rx: 3.5
      const dBack = sdfRoundedRect(nx, ny, 2.5, 6.5, 13.5, 14, 3.5);
      if (dBack <= 0.5) {
        const alpha = Math.max(0, Math.min(1, 0.5 - dBack));
        const t = Math.max(0, Math.min(1, ((nx - 2) + (ny - 5)) / 32));
        const col = lerpColor([90, 200, 250], [10, 132, 255], t); // #5AC8FA -> #0A84FF
        pixelColor = blend(pixelColor, [col[0], col[1], col[2], alpha * 0.55 * 255]);
      }

      // 2. 前层主卡片: x: 6.5, y: 3.5, w: 15, h: 15.5, rx: 4
      const dFront = sdfRoundedRect(nx, ny, 6.5, 3.5, 15, 15.5, 4);
      if (dFront <= 0.5) {
        const alpha = Math.max(0, Math.min(1, 0.5 - dFront));
        const t = Math.max(0, Math.min(1, ((nx - 6) + (ny - 2)) / 32));
        const col = lerpColor([10, 132, 255], [0, 102, 204], t); // #0A84FF -> #0066CC
        pixelColor = blend(pixelColor, [col[0], col[1], col[2], alpha * 255]);

        // 表面 1px 高光描边
        const dHighlight = Math.abs(dFront + 0.4);
        if (dHighlight <= 0.45) {
          const hAlpha = Math.max(0, Math.min(1, 1 - dHighlight / 0.45)) * 0.35;
          pixelColor = blend(pixelColor, [255, 255, 255, hAlpha * 255]);
        }
      }

      // 3. 分享箭头 (45° 跃出 + 箭羽)
      // 主干: (10.5, 15) -> (17.5, 8)
      const dStem = sdfSegment(nx, ny, 10.5, 15, 17.5, 8);
      // 翼1: (12.5, 8) -> (17.5, 8)
      const dWing1 = sdfSegment(nx, ny, 12.5, 8, 17.5, 8);
      // 翼2: (17.5, 8) -> (17.5, 13)
      const dWing2 = sdfSegment(nx, ny, 17.5, 8, 17.5, 13);

      const dArrow = Math.min(dStem, dWing1, dWing2) - 1.0; // 线宽 2.0 (半径 1.0)
      if (dArrow <= 0.5) {
        const arrowAlpha = Math.max(0, Math.min(1, 0.5 - dArrow));
        pixelColor = blend(pixelColor, [255, 255, 255, arrowAlpha * 255]);
      }

      totalR += pixelColor[0];
      totalG += pixelColor[1];
      totalB += pixelColor[2];
      totalA += pixelColor[3];
    }

    return [
      totalR / samples.length,
      totalG / samples.length,
      totalB / samples.length,
      totalA / samples.length,
    ];
  });
}

const targetDirs = [
  path.resolve('public'),
  path.resolve('public/icon'),
  path.resolve('src/public'),
  path.resolve('src/public/icon'),
];

for (const dir of targetDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 生成 16, 32, 48, 128 分辨率 PNG 图标
const sizes = [16, 32, 48, 128];
for (const size of sizes) {
  const pngBuf = render2AIcons(size);
  // 写到 public/icon/16.png & src/public/icon/16.png
  fs.writeFileSync(path.resolve(`public/icon/${size}.png`), pngBuf);
  fs.writeFileSync(path.resolve(`src/public/icon/${size}.png`), pngBuf);
  // 写到 public/icon-16.png & src/public/icon-16.png
  fs.writeFileSync(path.resolve(`public/icon-${size}.png`), pngBuf);
  fs.writeFileSync(path.resolve(`src/public/icon-${size}.png`), pngBuf);
  // 如果是 128 也写一个默认的 icon.png
  if (size === 128) {
    fs.writeFileSync(path.resolve('public/icon.png'), pngBuf);
    fs.writeFileSync(path.resolve('src/public/icon.png'), pngBuf);
  }
  console.log(`Generated ${size}px icon (${pngBuf.length} bytes)`);
}

// 写入矢量 icon.svg
const svgContent = `
<svg viewBox="0 0 24 24" width="128" height="128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="qs-ext-front" x1="6" y1="2" x2="22" y2="18" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0A84FF" />
      <stop offset="100%" stop-color="#0066CC" />
    </linearGradient>
    <linearGradient id="qs-ext-back" x1="2" y1="5" x2="18" y2="21" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5AC8FA" />
      <stop offset="100%" stop-color="#0A84FF" />
    </linearGradient>
  </defs>
  <rect x="2.5" y="6.5" width="13.5" height="14" rx="3.5" fill="url(#qs-ext-back)" fill-opacity="0.5" />
  <rect x="6.5" y="3.5" width="15" height="15.5" rx="4" fill="url(#qs-ext-front)" />
  <rect x="7" y="4" width="14" height="14.5" rx="3.5" stroke="#FFFFFF" stroke-opacity="0.35" stroke-width="0.8" />
  <path
    d="M10.5 15L17.5 8M17.5 8H12.5M17.5 8V13"
    stroke="#FFFFFF"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
`.trim();

fs.writeFileSync(path.resolve('public/icon/icon.svg'), svgContent);
fs.writeFileSync(path.resolve('public/icon.svg'), svgContent);
fs.writeFileSync(path.resolve('src/public/icon/icon.svg'), svgContent);
fs.writeFileSync(path.resolve('src/public/icon.svg'), svgContent);
console.log('Generated icon.svg files');
