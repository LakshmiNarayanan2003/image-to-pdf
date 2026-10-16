import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkHeaderDimensions, detectFormat } from './detect';
import { jpegInfo, stripJpegMetadata } from './exif';
import { checkDimensions, checkFile, LIMITS } from '../validation/limits';
import { safeSvg } from './svg';
const data = (name: string) =>
  new Uint8Array(readFileSync(`tests/fixtures/${name}`));
for (const [file, format] of [
  ['landscape.jpg', 'jpeg'],
  ['quadrants.png', 'png'],
  ['graphic.webp', 'webp'],
  ['graphic.avif', 'avif'],
  ['animation.gif', 'gif'],
  ['graphic.bmp', 'bmp'],
  ['vector.svg', 'svg'],
  ['graphic.tiff', 'tiff'],
  ['graphic.heic', 'heic'],
  ['graphic.ico', 'ico'],
] as const) {
  it(`detects ${format} from bytes despite a misleading extension`, () => {
    expect(detectFormat(data(file), 'wrong.jpg', '')).toBe(format);
    expect(() => checkHeaderDimensions(data(file), format)).not.toThrow();
  });
}
it('accepts known image bytes with a mismatched image MIME', () =>
  expect(detectFormat(data('quadrants.png'), 'photo.jpg', 'image/jpeg')).toBe(
    'png',
  ));
it('rejects MIME that describes another document type', () =>
  expect(() =>
    detectFormat(data('quadrants.png'), 'photo.png', 'application/pdf'),
  ).toThrow('content type'));
for (const file of ['fake.jpg', 'empty.png'])
  it(`rejects invalid signature ${file}`, () =>
    expect(() => detectFormat(data(file), file)).toThrow('signature'));
for (const name of ['photo.CR2', 'photo.DNG', 'photo.NEF', 'photo.jxl'])
  it(`does not treat ${name} as ordinary TIFF`, () =>
    expect(() => detectFormat(data('graphic.tiff'), name)).toThrow(
      'not supported',
    ));
it('rejects huge dimensions before pixel allocation', () =>
  expect(() =>
    checkHeaderDimensions(data('huge-dimensions.png'), 'png'),
  ).toThrow('24 megapixel'));
it('rejects truncated JPEG headers', () =>
  expect(() => checkHeaderDimensions(data('corrupt.jpg'), 'jpeg')).toThrow(
    'header',
  ));
for (const [w, h] of [
  [0, 10],
  [-1, 2],
  [NaN, 1],
  [Infinity, 1],
  [1.5, 10],
])
  it(`rejects invalid dimensions ${w} × ${h}`, () =>
    expect(() => checkDimensions(w, h)).toThrow('invalid'));
it('bounds area independently of edge length', () =>
  expect(() => checkDimensions(6000, 6000)).toThrow('24 megapixel'));
it('accepts the documented boundary', () =>
  expect(() => checkDimensions(6000, 4000)).not.toThrow());
it('enforces empty, per-file, total-byte and page-count safeguards', () => {
  expect(() => checkFile(0, 0, 0)).toThrow('empty');
  expect(() => checkFile(LIMITS.fileBytes + 1, 0, 0)).toThrow('40 MB');
  expect(() => checkFile(10, 0, LIMITS.inputBytes)).toThrow('200 MB');
  expect(() => checkFile(10, 50, 0)).toThrow('50 pages');
  expect(() => checkFile(LIMITS.fileBytes, 0, 0)).not.toThrow();
});
for (let o = 1; o <= 8; o++)
  it(`reads EXIF orientation ${o}`, () =>
    expect(jpegInfo(data(`exif-${o}.jpg`)).orientation).toBe(o));
it('direct embedding accepts ordinary three-channel JPEG', () =>
  expect(jpegInfo(data('landscape.jpg')).direct).toBe(true));
it('direct embedding excludes ICC profiles and transformed JPEGs', () =>
  expect(jpegInfo(data('exif-6.jpg')).direct).toBe(false));
it('removes EXIF metadata while preserving JPEG scan bytes', () => {
  const original = data('exif-6.jpg'),
    clean = stripJpegMetadata(original);
  expect(new TextDecoder().decode(clean)).not.toContain('Exif');
  expect(clean.slice(-100)).toEqual(original.slice(-100));
  expect(jpegInfo(clean).orientation).toBe(1);
});
describe('SVG threat boundary', () => {
  it('accepts the original static vector', () => {
    const result = safeSvg(new TextDecoder().decode(data('vector.svg')));
    expect([result.width, result.height]).toEqual([160, 100]);
    expect(result.blob.type).toBe('image/svg+xml');
  });
  for (const content of [
    '<script>alert(1)</script>',
    '<foreignObject><div>HTML</div></foreignObject>',
    '<image href="https://attacker.invalid/track"/>',
    '<style>@import "https://attacker.invalid";</style>',
    '<rect onload="alert(1)"/>',
    '<rect fill="url(https://attacker.invalid/x)"/>',
    '<animate attributeName="href"/>',
    '<use href="#cycle"/>',
  ])
    it(`rejects active/external element: ${content.slice(0, 24)}`, () =>
      expect(() =>
        safeSvg(`<svg xmlns="http://www.w3.org/2000/svg">${content}</svg>`),
      ).toThrow());
  it('rejects entity declarations', () =>
    expect(() =>
      safeSvg(
        '<!DOCTYPE svg [<!ENTITY e "x">]><svg xmlns="http://www.w3.org/2000/svg"/>',
      ),
    ).toThrow('entities'));
  it('rejects malformed XML', () =>
    expect(() =>
      safeSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect></svg>'),
    ).toThrow('malformed'));
  it('uses bounded viewBox dimensions', () => {
    expect(
      safeSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 400"/>')
        .width,
    ).toBe(200);
    expect(() =>
      safeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg" width="999999" height="5"/>',
      ),
    ).toThrow('8192');
  });
  it('permits local gradient references only', () =>
    expect(() =>
      safeSvg(
        '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><rect width="10" height="10" fill="url(#g)"/></svg>',
      ),
    ).not.toThrow());
});
