import type { ImageFormat } from '../types';
import { UserError } from '../utils';
import { checkDimensions } from '../validation/limits';
export const MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  heic: 'image/heic',
  tiff: 'image/tiff',
  ico: 'image/x-icon',
};
export const ACCEPT =
  '.jpg,.jpeg,.jfif,.png,.webp,.gif,.bmp,.svg,.avif,.heic,.heif,.tif,.tiff,.ico';
const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.subarray(start, end));
export function detectFormat(
  bytes: Uint8Array,
  name = '',
  mime = '',
): ImageFormat {
  // RAW containers can share TIFF/HEIF signatures, but lack the required rendering pipeline.
  if (/\.(cr2|cr3|nef|arw|raf|dng|jxl)$/i.test(name))
    throw new UserError(
      'RAW camera files and JPEG XL are not supported. Export a JPEG or PNG first.',
    );
  let format: ImageFormat | undefined;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
    format = 'jpeg';
  else if (ascii(bytes, 0, 8) === '\x89PNG\r\n\x1a\n') format = 'png';
  else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 12) === 'WEBP')
    format = 'webp';
  else if (/^GIF8[79]a$/.test(ascii(bytes, 0, 6))) format = 'gif';
  else if (ascii(bytes, 0, 2) === 'BM') format = 'bmp';
  else if (['II*\0', 'MM\0*'].includes(ascii(bytes, 0, 4))) format = 'tiff';
  else if (ascii(bytes, 0, 4) === '\0\0\x01\0') format = 'ico';
  else if (ascii(bytes, 4, 8) === 'ftyp' && bytes.length >= 16) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const end = Math.min(view.getUint32(0), bytes.length, 256);
    const brands = [ascii(bytes, 8, 12)];
    for (let i = 16; i + 4 <= end; i += 4) brands.push(ascii(bytes, i, i + 4));
    if (brands.some((b) => ['avif', 'avis'].includes(b))) format = 'avif';
    else if (
      brands.some((b) =>
        ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(b),
      )
    )
      format = 'heic';
  } else if (
    /^(?:\uFEFF)?\s*(?:<\?xml[^>]*>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(
      new TextDecoder().decode(bytes.subarray(0, 4096)),
    )
  )
    format = 'svg';
  if (!format)
    throw new UserError(
      'No supported image signature found. Choose a valid JPG, PNG, WebP, GIF, BMP, SVG, AVIF, HEIC, TIFF or ICO.',
    );
  // File signatures take precedence over incorrect names/MIME; the Blob is retyped before decoding.
  if (
    mime &&
    !/^(image\/|application\/octet-stream$|text\/plain$|application\/xml$|text\/xml$)/i.test(
      mime,
    )
  )
    throw new UserError(
      'This file has a non-image content type. Export it as an image first.',
    );
  return format;
}
export function checkHeaderDimensions(bytes: Uint8Array, format: ImageFormat) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const guard = (w: number, h: number) => checkDimensions(w, h);
  try {
    if (format === 'png') {
      if (ascii(bytes, 12, 16) !== 'IHDR') throw new Error();
      guard(view.getUint32(16), view.getUint32(20));
    }
    if (format === 'gif')
      guard(view.getUint16(6, true), view.getUint16(8, true));
    if (format === 'bmp') {
      const dib = view.getUint32(14, true);
      guard(
        dib === 12 ? view.getUint16(18, true) : view.getInt32(18, true),
        dib === 12
          ? view.getUint16(20, true)
          : Math.abs(view.getInt32(22, true)),
      );
    }
    if (format === 'webp') {
      const kind = ascii(bytes, 12, 16);
      if (kind === 'VP8X')
        guard(
          1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16)),
          1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16)),
        );
      else if (kind === 'VP8L') {
        const bits = view.getUint32(21, true);
        guard((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1);
      } else if (kind === 'VP8 ')
        guard(
          view.getUint16(26, true) & 0x3fff,
          view.getUint16(28, true) & 0x3fff,
        );
    }
    if (format === 'jpeg') {
      let found = false;
      for (let i = 2; i + 4 < bytes.length;) {
        if (bytes[i] !== 0xff) throw new Error();
        const marker = bytes[i + 1];
        if (marker === 0xda || marker === 0xd9) break;
        const len = view.getUint16(i + 2);
        if (len < 2 || i + 2 + len > bytes.length) throw new Error();
        if (
          [
            0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
            0xce, 0xcf,
          ].includes(marker)
        ) {
          guard(view.getUint16(i + 7), view.getUint16(i + 5));
          found = true;
          break;
        }
        i += 2 + len;
      }
      if (!found) throw new Error();
    }
    // ISO BMFF spatial-extents boxes: reject every declared raster before native/WASM allocation.
    if (format === 'avif' || format === 'heic') {
      for (let i = 4; i + 16 <= bytes.length; i++)
        if (ascii(bytes, i, i + 4) === 'ispe' && view.getUint32(i - 4) === 20)
          guard(view.getUint32(i + 8), view.getUint32(i + 12));
    }
  } catch (error) {
    if (error instanceof UserError) throw error;
    throw new UserError('The image header is damaged or incomplete.');
  }
}
