import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
async function files(dir) {
  return (
    await Promise.all(
      (await readdir(dir)).map(async (name) => {
        const p = `${dir}/${name}`;
        return (await stat(p)).isDirectory() ? files(p) : [p];
      }),
    )
  ).flat();
}
const html = await readFile('dist/index.html', 'utf8');
for (const directive of [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "connect-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
])
  assert(html.includes(directive), `Missing CSP: ${directive}`);
assert(
  !/['"]unsafe-inline['"]|['"]unsafe-eval['"]/.test(html),
  'Unsafe CSP allowance',
);
for (const match of html.matchAll(
  /<(?:script|link)[^>]+(?:src|href)="([^"]+)"/g,
)) {
  if (match[0].includes('canonical')) continue;
  assert(
    !/^(https?:)?\/\//.test(match[1]),
    `Remote executable/style asset: ${match[1]}`,
  );
}
const source = await files('src');
for (const file of source.filter(
  (f) => /\.(ts|tsx|css)$/.test(f) && !f.includes('.test.'),
)) {
  const text = await readFile(file, 'utf8');
  assert(
    !/\b(?:fetch|import)\s*\(\s*['"`]https?:/.test(text),
    `Remote runtime request in ${file}`,
  );
  assert(
    !/navigator\.sendBeacon|XMLHttpRequest|WebSocket|serviceWorker\.register|localStorage|sessionStorage|indexedDB|dangerouslySetInnerHTML/.test(
      text,
    ),
    `Unexpected persistence/network/HTML primitive in ${file}`,
  );
  if (/\bfetch\s*\(/.test(text)) {
    assert(file === 'src/hooks/useConverter.ts');
    assert(
      /fetch\(\s*`\$\{import\.meta\.env\.BASE_URL\}samples\/\$\{name\}`\s*,/.test(
        text,
      ),
    );
  }
}
const outputs = await files('dist');
for (const file of [
  'sample-photo.jpg',
  'sample-transparent.png',
  'sample-graphic.webp',
  'sample-vector.svg',
])
  assert((await stat(`dist/samples/${file}`)).size > 50);
for (const name of ['decoder.worker', 'libheif-bundle', 'tiff-'])
  assert(
    outputs.some((f) => f.includes(name)),
    `Missing ${name}`,
  );
assert(
  !outputs.some((f) => /\.map$|\.env|service-worker/.test(f)),
  'Unexpected source/private/cache asset',
);
const manifest = JSON.parse(
  await readFile('dist/vendor-src/manifest.json', 'utf8'),
);
for (const item of manifest)
  assert.equal(
    createHash('sha256')
      .update(await readFile(`dist/vendor-src/${item.file}`))
      .digest('hex'),
    item.sha256,
    `Incorrect corresponding source archive: ${item.file}`,
  );
for (const name of [
  'GPL-3.txt',
  'LGPL-3.txt',
  'libheif-COPYING.txt',
  'libde265-COPYING.txt',
])
  assert((await stat(`dist/notices/${name}`)).size > 1000);
const notices = JSON.parse(await readFile('dist/licenses/index.json', 'utf8'));
assert(notices.length > 10);
for (const item of notices)
  assert(item.files.length, `Missing notices for ${item.name}`);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.name, 'pix2pdf');
assert.equal(pkg.version, '0.1.0');
assert(pkg.repository.url.endsWith('/image-to-pdf.git'));
assert(html.includes(pkg.homepage));
console.log(
  `Static privacy/CSP, sample, metadata and license checks passed; ${outputs.length} build files inspected.`,
);
