import type { PdfOptions, Rotation } from '../types';
import { rotatedSize, UserError } from '../utils';
export const POINTS_PER_MM = 72 / 25.4;
export const PAGE_SIZES = {
  a4: [210 * POINTS_PER_MM, 297 * POINTS_PER_MM],
  letter: [612, 792],
  legal: [612, 1008],
  a3: [297 * POINTS_PER_MM, 420 * POINTS_PER_MM],
  a5: [148 * POINTS_PER_MM, 210 * POINTS_PER_MM],
} as const;
export const MARGINS = {
  none: 0,
  small: 5 * POINTS_PER_MM,
  medium: 10 * POINTS_PER_MM,
  large: 20 * POINTS_PER_MM,
} as const;
export function pageLayout(
  width: number,
  height: number,
  rotation: Rotation,
  options: PdfOptions,
) {
  const oriented = rotatedSize(width, height, rotation);
  if (!(
    oriented.width > 0 &&
    oriented.height > 0 &&
    Number.isFinite(width * height)
  ))
    throw new UserError('Invalid image dimensions.');
  const margin = MARGINS[options.margin];
  let pw: number, ph: number;
  if (options.pageSize === 'auto') {
    // 96 CSS pixels per inch = 0.75 PDF points/px. Cap content at 1440pt (20in).
    const factor = Math.min(
      0.75,
      1440 / Math.max(oriented.width, oriented.height),
    );
    pw = oriented.width * factor + 2 * margin;
    ph = oriented.height * factor + 2 * margin;
  } else [pw, ph] = PAGE_SIZES[options.pageSize];
  const landscape =
    options.orientation === 'landscape' ||
    (options.orientation === 'auto' && oriented.width > oriented.height);
  if ((landscape && pw < ph) || (!landscape && pw > ph)) [pw, ph] = [ph, pw];
  const availableWidth = pw - 2 * margin,
    availableHeight = ph - 2 * margin;
  if (availableWidth <= 0 || availableHeight <= 0)
    throw new UserError('Margins leave no room for the image.');
  const scale =
    options.fit === 'actual'
      ? 0.75
      : Math[options.fit === 'fill' ? 'max' : 'min'](
          availableWidth / oriented.width,
          availableHeight / oriented.height,
        );
  const drawWidth = oriented.width * scale,
    drawHeight = oriented.height * scale;
  return {
    pageWidth: pw,
    pageHeight: ph,
    margin,
    availableWidth,
    availableHeight,
    width: drawWidth,
    height: drawHeight,
    x: (pw - drawWidth) / 2,
    y: (ph - drawHeight) / 2,
  };
}
