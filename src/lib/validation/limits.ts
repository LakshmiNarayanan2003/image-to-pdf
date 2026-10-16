import { UserError } from '../utils';
export const LIMITS = {
  files: 50,
  fileBytes: 40 * 1024 * 1024,
  inputBytes: 200 * 1024 * 1024,
  pixels: 24_000_000,
  dimension: 8192,
  retainedBytes: 128 * 1024 * 1024,
  outputBytes: 128 * 1024 * 1024,
  svgBytes: 2 * 1024 * 1024,
} as const;
export function checkDimensions(width: number, height: number) {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  )
    throw new UserError('This image has invalid dimensions.');
  if (
    width > LIMITS.dimension ||
    height > LIMITS.dimension ||
    width * height > LIMITS.pixels
  )
    throw new UserError(
      'Image exceeds the 24 megapixel / 8192 pixels per side safety limit. Resize it first.',
    );
}
export function checkFile(size: number, count: number, total: number) {
  if (!size) throw new UserError('This file is empty. Choose a valid image.');
  if (size > LIMITS.fileBytes)
    throw new UserError('This file exceeds the 40 MB safety limit.');
  if (count >= LIMITS.files)
    throw new UserError(
      'Keep up to 50 pages at a time. Remove pages before adding more.',
    );
  if (total + size > LIMITS.inputBytes)
    throw new UserError('Total input exceeds the 200 MB safety limit.');
}
