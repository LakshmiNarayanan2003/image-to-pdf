// @vitest-environment node
import { Blob as NodeBlob } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { PDFDocument, PDFName } from 'pdf-lib';
import { expect, it } from 'vitest';
import { buildPdf } from './build';
import { DEFAULT_OPTIONS, type ImageItem } from '../types';
import { inputBytes, retainedBytes } from '../download/lifecycle';
const png = new NodeBlob([readFileSync('tests/fixtures/quadrants.png')], {
  type: 'image/png',
}) as unknown as Blob;
const item: ImageItem = {
  id: '1',
  sourceId: 'source',
  name: 'private-source.png',
  size: 1000,
  format: 'png',
  width: 160,
  height: 100,
  rotation: 0,
  png,
  previewUrl: 'blob:local',
  note: '',
};
it('creates parsable multi-page PDF with metadata and image streams in display order', async () => {
  const output = await buildPdf(
    [item, { ...item, id: '2', width: 100, height: 160, rotation: 0 }],
    {
      ...DEFAULT_OPTIONS,
      pageSize: 'auto',
      margin: 'none',
      quality: 'maximum',
      filename: 'my photos',
    },
    new AbortController().signal,
    () => {},
  );
  const pdf = await PDFDocument.load(await output.blob.arrayBuffer(), {
    updateMetadata: false,
  });
  expect(pdf.getPageCount()).toBe(2);
  expect(pdf.getPages().map((p) => p.getSize())).toEqual([
    { width: 120, height: 75 },
    { width: 75, height: 120 },
  ]);
  expect(pdf.getTitle()).toBe('my photos');
  expect(pdf.getCreator()).toBe('Pix2PDF');
  expect(pdf.getProducer()).toBe('Pix2PDF');
  expect(output.name).toBe('my photos.pdf');
  for (const page of pdf.getPages())
    expect(page.node.Resources()?.has(PDFName.of('XObject'))).toBe(true);
  expect(
    new TextDecoder().decode(await output.blob.arrayBuffer()),
  ).not.toContain('private-source');
});
it('rejects no pages and pre-aborted operations', async () => {
  await expect(
    buildPdf([], DEFAULT_OPTIONS, new AbortController().signal, () => {}),
  ).rejects.toThrow('1 and 50');
  const c = new AbortController();
  c.abort();
  await expect(
    buildPdf([item], DEFAULT_OPTIONS, c.signal, () => {}),
  ).rejects.toMatchObject({ name: 'AbortError' });
});
it('counts multi-page file input once but every normalized page in memory', () => {
  const items = [item, { ...item, id: '2' }];
  expect(inputBytes(items)).toBe(1000);
  expect(retainedBytes(items)).toBe(png.size * 2);
});
