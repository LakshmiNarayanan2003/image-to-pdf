import { decode } from 'tiff';
import { checkDimensions, LIMITS } from '../validation/limits';
import { UserError } from '../utils';
// Bound the linked IFD chain and entry arrays before entering the third-party parser.
export function preflightTiff(bytes: ArrayBuffer, maxPages: number) {
  const view = new DataView(bytes),
    little = view.getUint16(0) === 0x4949,
    seen = new Set<number>();
  let offset = view.getUint32(4, little);
  while (offset) {
    if (seen.has(offset) || seen.size >= maxPages)
      throw new UserError(
        'TIFF has a cyclic directory or exceeds the remaining 50-page limit.',
      );
    seen.add(offset);
    if (offset + 2 > view.byteLength) throw new Error('Truncated TIFF');
    const count = view.getUint16(offset, little),
      end = offset + 2 + count * 12;
    if (count > 256 || end + 4 > view.byteLength)
      throw new Error('Invalid TIFF directory');
    for (let i = offset + 2; i < end; i += 12) {
      const tag = view.getUint16(i, little),
        entries = view.getUint32(i + 4, little);
      if (entries > 1_000_000)
        throw new UserError('TIFF contains an oversized metadata array.');
      if ([330, 34665, 34853, 50706].includes(tag))
        throw new UserError(
          'TIFF subdirectories, RAW and embedded EXIF/GPS directories are not supported. Export a standard TIFF or PNG.',
        );
    }
    offset = view.getUint32(end, little);
  }
  if (!seen.size) throw new Error('Empty TIFF');
  const meta = decode(bytes, { ignoreImageData: true });
  for (const page of meta) {
    checkDimensions(page.width, page.height);
    if (
      ![1, 2, 3, 4].includes(page.components) ||
      ![1, 8, 16].includes(page.bitsPerSample) ||
      ![0, 1, 2, 3].includes(page.type)
    )
      throw new UserError(
        'This TIFF color model or bit depth is unsupported. Use an 8/16-bit RGB or grayscale TIFF.',
      );
  }
  return meta.length;
}
export function tiffPage(bytes: ArrayBuffer, index: number) {
  const page = decode(bytes, { pages: [index] })[0];
  checkDimensions(page.width, page.height);
  const rgba = new Uint8ClampedArray(page.width * page.height * 4);
  const max =
    page.bitsPerSample === 16 ? 65535 : page.bitsPerSample === 1 ? 1 : 255;
  const value = (v: number) => Math.round((v / max) * 255);
  if (page.data.length < page.width * page.height * page.components)
    throw new Error('Incomplete TIFF pixels');
  for (let pixel = 0; pixel < page.width * page.height; pixel++) {
    const start = pixel * page.components,
      out = pixel * 4;
    if (page.type === 3) {
      const color = page.palette?.[page.data[start]];
      if (!color) throw new Error('Invalid TIFF palette');
      rgba.set(
        color.map((v) => Math.round(v / 257)),
        out,
      );
    } else if (page.type === 2)
      rgba.set(
        [
          value(page.data[start]),
          value(page.data[start + 1]),
          value(page.data[start + 2]),
        ],
        out,
      );
    else {
      const gray =
        page.type === 0
          ? 255 - value(page.data[start])
          : value(page.data[start]);
      rgba.set([gray, gray, gray], out);
    }
    rgba[out + 3] = page.alpha
      ? value(page.data[start + page.components - 1])
      : 255;
  }
  return {
    data: new ImageData(rgba, page.width, page.height),
    orientation: page.orientation || 1,
  };
}
export const TIFF_LIMIT = LIMITS.files;
