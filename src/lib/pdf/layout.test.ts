import { expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../types';
import { MARGINS, pageLayout, PAGE_SIZES } from './layout';
import {
  friendlyError,
  pdfFilename,
  reorder,
  rotate,
  rotatedSize,
  UserError,
} from '../utils';
for (const size of ['a4', 'letter', 'legal', 'a3', 'a5'] as const)
  it(`uses physical ${size} dimensions`, () => {
    const layout = pageLayout(100, 200, 0, {
      ...DEFAULT_OPTIONS,
      pageSize: size,
    });
    expect([layout.pageWidth, layout.pageHeight]).toEqual(PAGE_SIZES[size]);
  });
it('A4 is 210 × 297 mm', () => {
  expect(PAGE_SIZES.a4[0]).toBeCloseTo(595.2756, 3);
  expect(PAGE_SIZES.a4[1]).toBeCloseTo(841.8898, 3);
});
it('Letter is 612 × 792 points', () =>
  expect(PAGE_SIZES.letter).toEqual([612, 792]));
it('auto orientation follows rotated image', () => {
  const a = pageLayout(200, 100, 0, DEFAULT_OPTIONS),
    b = pageLayout(200, 100, 90, DEFAULT_OPTIONS);
  expect(a.pageWidth).toBeGreaterThan(a.pageHeight);
  expect(b.pageWidth).toBeLessThan(b.pageHeight);
});
it('explicit portrait overrides landscape content', () =>
  expect(
    pageLayout(200, 100, 0, { ...DEFAULT_OPTIONS, orientation: 'portrait' })
      .pageWidth,
  ).toBeLessThan(600));
it('explicit landscape overrides portrait content', () =>
  expect(
    pageLayout(100, 200, 0, { ...DEFAULT_OPTIONS, orientation: 'landscape' })
      .pageWidth,
  ).toBeGreaterThan(800));
for (const margin of ['none', 'small', 'medium', 'large'] as const)
  it(`places ${margin} margins in physical units`, () => {
    const l = pageLayout(100, 100, 0, { ...DEFAULT_OPTIONS, margin });
    expect(l.margin).toBe(MARGINS[margin]);
    expect(l.width).toBeCloseTo(l.pageWidth - 2 * MARGINS[margin]);
  });
it('fit preserves all content and aspect ratio', () => {
  const l = pageLayout(200, 100, 0, {
    ...DEFAULT_OPTIONS,
    orientation: 'portrait',
  });
  expect(l.width / l.height).toBe(2);
  expect(l.width).toBeLessThanOrEqual(l.availableWidth);
  expect(l.height).toBeLessThanOrEqual(l.availableHeight);
});
it('fill covers the content box and clips excess', () => {
  const l = pageLayout(200, 100, 0, {
    ...DEFAULT_OPTIONS,
    orientation: 'portrait',
    fit: 'fill',
  });
  expect(l.width).toBeGreaterThan(l.availableWidth);
  expect(l.height).toBe(l.availableHeight);
  expect(l.x).toBeLessThan(l.margin);
});
it('actual size maps pixels at 96 DPI', () => {
  const l = pageLayout(200, 100, 0, { ...DEFAULT_OPTIONS, fit: 'actual' });
  expect([l.width, l.height]).toEqual([150, 75]);
});
it('match image maps pixels and adds margins', () => {
  const l = pageLayout(200, 100, 0, {
    ...DEFAULT_OPTIONS,
    pageSize: 'auto',
    margin: 'none',
  });
  expect([l.pageWidth, l.pageHeight]).toEqual([150, 75]);
});
it('match image caps physical size', () => {
  const l = pageLayout(8000, 2000, 0, {
    ...DEFAULT_OPTIONS,
    pageSize: 'auto',
    margin: 'none',
  });
  expect([l.pageWidth, l.pageHeight]).toEqual([1440, 360]);
});
it('layout rejects nonfinite dimensions', () =>
  expect(() => pageLayout(Infinity, 1, 0, DEFAULT_OPTIONS)).toThrow());
for (const [input, output] of [
  ['', 'images.pdf'],
  [' .pdf', 'images.pdf'],
  ['a.PDF.pdf', 'a.pdf'],
  ['a/b\\c:<x>?*.pdf', 'a-b-c--x.pdf'],
  ['旅行.pdf', '旅行.pdf'],
  ['CON', 'images-CON.pdf'],
  ['a\u202eb', 'a-b.pdf'],
])
  it(`normalizes filename ${JSON.stringify(input)}`, () =>
    expect(pdfFilename(input)).toBe(output));
it('truncates long filenames', () =>
  expect(pdfFilename('x'.repeat(500)).length).toBe(104));
it('reorders without mutating the previous list', () => {
  const a = ['a', 'b', 'c'];
  expect(reorder(a, 0, 2)).toEqual(['b', 'c', 'a']);
  expect(a).toEqual(['a', 'b', 'c']);
  expect(reorder(a, 2, 0)).toEqual(['c', 'a', 'b']);
  expect(reorder(a, 0, -1)).toBe(a);
});
it('keeps duplicate values while reordering', () =>
  expect(reorder(['same', 'other', 'same'], 1, 2)).toEqual([
    'same',
    'same',
    'other',
  ]));
it('rotates both directions and wraps at 360', () => {
  expect(rotate(0, -90)).toBe(270);
  expect(rotate(270, 90)).toBe(0);
  expect(rotatedSize(100, 200, 90)).toEqual({ width: 200, height: 100 });
  expect(rotatedSize(100, 200, 180)).toEqual({ width: 100, height: 200 });
});
it('does not expose decoder internals in error messages', () => {
  expect(friendlyError(new Error('private metadata'))).not.toContain(
    'private metadata',
  );
  expect(friendlyError(new UserError('Choose an image.'))).toBe(
    'Choose an image.',
  );
});
