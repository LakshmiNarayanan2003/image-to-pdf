import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { createCanvas } from '@napi-rs/canvas';
export const fixture = (name: string) => path.resolve('tests/fixtures', name);
export async function upload(page: Page, names: string[]) {
  await page.getByLabel('Image file picker').setInputFiles(names.map(fixture));
  await expect(
    page.getByRole('button', { name: 'Create PDF', exact: true }),
  ).toBeEnabled();
}
export async function autoLayout(page: Page) {
  await page.getByLabel('Page size', { exact: true }).selectOption('auto');
  await page.getByLabel('Margins', { exact: true }).selectOption('none');
  await page.getByLabel('PDF quality', { exact: true }).selectOption('maximum');
}
export async function output(page: Page) {
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  const link = page.getByRole('link', { name: 'Download PDF', exact: true });
  await expect(link).toBeVisible();
  const event = page.waitForEvent('download');
  await link.click();
  const download = await event;
  expect(await download.failure()).toBeNull();
  const target = await download.path();
  expect(target).toBeTruthy();
  const bytes = await readFile(target!);
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-');
  return {
    name: download.suggestedFilename(),
    bytes,
    pdf: await PDFDocument.load(bytes, { updateMetadata: false }),
  };
}
export async function pixels(bytes: Buffer, pageNumber = 1) {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: false,
    verbosity: 0,
  });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(pageNumber),
      viewport = page.getViewport({ scale: 1 });
    const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height),
      ),
      ctx = canvas.getContext('2d');
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    const width = canvas.width,
      height = canvas.height,
      data = ctx.getImageData(0, 0, width, height).data;
    return {
      width,
      height,
      at: (x: number, y: number) =>
        Array.from(
          data.slice(
            (Math.min(height - 1, Math.floor(y)) * width +
              Math.min(width - 1, Math.floor(x))) *
              4,
            (Math.min(height - 1, Math.floor(y)) * width +
              Math.min(width - 1, Math.floor(x))) *
              4 +
              3,
          ),
        ),
      quarter: (x: number, y: number) =>
        Array.from(
          data.slice(
            (Math.floor(height * y) * width + Math.floor(width * x)) * 4,
            (Math.floor(height * y) * width + Math.floor(width * x)) * 4 + 3,
          ),
        ),
    };
  } finally {
    await task.destroy();
  }
}
export function color(actual: number[], expected: number[], tolerance = 14) {
  actual.forEach((v, i) =>
    expect(Math.abs(v - expected[i])).toBeLessThanOrEqual(tolerance),
  );
}
export const RED = [220, 30, 30],
  GREEN = [30, 180, 60],
  BLUE = [30, 60, 220],
  YELLOW = [240, 200, 30];
