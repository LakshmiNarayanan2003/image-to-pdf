import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, open } from 'node:fs/promises';
import {
  autoLayout,
  upload,
  output,
  pixels,
  color,
  RED,
  GREEN,
  BLUE,
  YELLOW,
  fixture,
} from './helpers';
test.beforeEach(async ({ page }) => {
  await page.goto('./');
});
test('sample workflow: reorder, rotate, configure, download and parse four pages', async ({
  page,
  browserName,
}) => {
  await expect(
    page.getByRole('heading', { name: 'A place for your pictures.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create PDF' })).toBeDisabled();
  await page.getByRole('button', { name: 'Try sample images' }).click();
  await expect(page.locator('.image-card')).toHaveCount(4);
  await page
    .getByRole('button', { name: 'Move down sample-photo.jpg, page 1' })
    .click();
  await expect(page.locator('.image-card h3').first()).toHaveText(
    'sample-transparent.png',
  );
  await page
    .getByRole('button', { name: 'Rotate right sample-photo.jpg, page 2' })
    .click();
  await page.getByLabel('Page size', { exact: true }).selectOption('letter');
  await page.getByLabel('Output filename').fill('My pictures.PDF');
  const out = await output(page);
  expect(out.name).toBe(
    browserName === 'webkit' ? 'My_pictures.pdf' : 'My pictures.pdf',
  );
  expect(out.pdf.getPageCount()).toBe(4);
  expect(out.pdf.getTitle()).toBe('My pictures');
  expect(out.pdf.getCreator()).toBe('Pix2PDF');
  expect(out.pdf.getProducer()).toBe('Pix2PDF');
  expect(out.pdf.getPages().map((p) => p.getSize())).toEqual([
    { width: 612, height: 792 },
    { width: 612, height: 792 },
    { width: 792, height: 612 },
    { width: 612, height: 792 },
  ]);
  await expect(
    page.getByRole('link', { name: 'Download again' }),
  ).toBeVisible();
});
for (const name of [
  'landscape.jpg',
  'quadrants.png',
  'graphic.webp',
  'vector.svg',
  'graphic.bmp',
  'animation.gif',
  'graphic.heic',
  'graphic.tiff',
  'lzw.tiff',
  'deflate.tiff',
  'graphic.ico',
  'graphic.avif',
  'renamed.jpg',
])
  test(`real ${name} converts to a rendered PDF`, async ({ page }) => {
    await upload(page, [name]);
    await autoLayout(page);
    const out = await output(page);
    expect(out.pdf.getPageCount()).toBe(1);
    const raster = await pixels(out.bytes);
    const dims = out.pdf.getPage(0).getSize();
    expect(dims).toEqual(
      name.endsWith('.ico')
        ? { width: 24, height: 24 }
        : { width: 120, height: 75 },
    );
    color(raster.quarter(0.25, 0.25), RED, name.endsWith('.heic') ? 28 : 14);
    color(raster.quarter(0.75, 0.25), GREEN, 28);
    color(raster.quarter(0.25, 0.75), BLUE, 28);
    color(raster.quarter(0.75, 0.75), YELLOW, 28);
    if (name.endsWith('.gif'))
      await expect(
        page.getByText('First frame', { exact: true }),
      ).toBeVisible();
  });
test('TIFF expands all pages in order and permits individual page removal', async ({
  page,
}) => {
  await upload(page, ['multi.tiff']);
  await expect(page.locator('.image-card')).toHaveCount(2);
  await autoLayout(page);
  const out = await output(page);
  expect(out.pdf.getPageCount()).toBe(2);
  color((await pixels(out.bytes, 1)).quarter(0.25, 0.25), RED);
  color((await pixels(out.bytes, 2)).quarter(0.25, 0.25), [255, 0, 255]);
  await page
    .getByRole('button', { name: 'Remove multi.tiff · page 1, page 1' })
    .click();
  await expect(page.locator('.image-card')).toHaveCount(1);
  expect((await output(page)).pdf.getPageCount()).toBe(1);
});
for (const [orientation, topLeft] of [
  [1, RED],
  [2, GREEN],
  [3, YELLOW],
  [4, BLUE],
  [5, RED],
  [6, BLUE],
  [7, YELLOW],
  [8, GREEN],
] as const)
  test(`EXIF orientation ${orientation} appears upright in preview and output`, async ({
    page,
  }) => {
    await upload(page, [`exif-${orientation}.jpg`]);
    await autoLayout(page);
    const out = await output(page);
    expect(out.pdf.getPage(0).getSize()).toEqual(
      orientation >= 5
        ? { width: 75, height: 120 }
        : { width: 120, height: 75 },
    );
    color((await pixels(out.bytes)).quarter(0.25, 0.25), [...topLeft]);
  });
for (const quality of ['standard', 'high', 'maximum'])
  test(`transparent PNG uses selected background at ${quality} quality`, async ({
    page,
  }) => {
    await upload(page, ['transparent.png']);
    await autoLayout(page);
    await page.getByLabel('PDF quality').selectOption(quality);
    let out = await output(page);
    color((await pixels(out.bytes)).at(2, 2), [255, 255, 255]);
    await page.getByLabel('Background', { exact: true }).selectOption('black');
    out = await output(page);
    const raster = await pixels(out.bytes);
    color(raster.at(2, 2), [0, 0, 0]);
    color(raster.quarter(0.65, 0.65), YELLOW, 28);
  });
test('mixed image order, keyboard move and clockwise rotation match rendered pages', async ({
  page,
}) => {
  await upload(page, ['landscape.jpg', 'portrait.jpg', 'graphic.webp']);
  await autoLayout(page);
  const handle = page.getByRole('button', {
    name: 'Reorder graphic.webp, page 3',
  });
  await handle.focus();
  await page.keyboard.press('Alt+ArrowUp');
  await expect(page.locator('.image-card h3')).toHaveText([
    'landscape.jpg',
    'graphic.webp',
    'portrait.jpg',
  ]);
  await page
    .getByRole('button', { name: 'Rotate right landscape.jpg, page 1' })
    .click();
  const out = await output(page);
  expect(out.pdf.getPages().map((p) => p.getSize())).toEqual([
    { width: 75, height: 120 },
    { width: 120, height: 75 },
    { width: 75, height: 120 },
  ]);
  color((await pixels(out.bytes, 1)).quarter(0.25, 0.25), BLUE);
  color((await pixels(out.bytes, 2)).quarter(0.25, 0.25), RED);
  await page
    .getByRole('button', { name: 'Rotate left landscape.jpg, page 1' })
    .click();
  await expect(page.getByRole('link', { name: /Download/ })).toHaveCount(0);
});
test('desktop drag reorder changes actual output order', async ({ page }) => {
  await upload(page, ['landscape.jpg', 'portrait.jpg']);
  await autoLayout(page);
  const handle = page.getByRole('button', {
    name: 'Reorder landscape.jpg, page 1',
  });
  await handle.scrollIntoViewIfNeeded();
  const from = await handle.boundingBox(),
    to = await page.locator('.image-card').nth(1).boundingBox();
  expect(from).toBeTruthy();
  expect(to).toBeTruthy();
  await page.mouse.move(from!.x + 4, from!.y + 4);
  await page.mouse.down();
  await page.mouse.move(from!.x + 14, from!.y + 14, { steps: 5 });
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 60, { steps: 12 });
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 65, { steps: 2 });
  await page.mouse.up();
  await expect(page.locator('.image-card h3')).toHaveText([
    'portrait.jpg',
    'landscape.jpg',
  ]);
  const out = await output(page);
  expect(out.pdf.getPage(0).getSize()).toEqual({ width: 75, height: 120 });
});
test('A4, Letter, orientation, fill, original-size and physical margins are reflected in output', async ({
  page,
}) => {
  await upload(page, ['quadrants.png']);
  await page
    .getByLabel('Orientation', { exact: true })
    .selectOption('portrait');
  await page.getByLabel('PDF quality').selectOption('maximum');
  let out = await output(page);
  expect(out.pdf.getPage(0).getWidth()).toBeCloseTo(595.2756, 3);
  expect(out.pdf.getPage(0).getHeight()).toBeCloseTo(841.8898, 3);
  let raster = await pixels(out.bytes);
  color(raster.at(5, 5), [255, 255, 255]);
  color(raster.quarter(0.25, 0.4), RED);
  await page.getByLabel('Image fit').selectOption('fill');
  out = await output(page);
  raster = await pixels(out.bytes);
  color(raster.at(20, 20), RED);
  color(raster.at(5, 5), [255, 255, 255]);
  await page.getByLabel('Margins', { exact: true }).selectOption('large');
  out = await output(page);
  raster = await pixels(out.bytes);
  color(raster.at(40, 40), [255, 255, 255]);
  color(raster.at(60, 60), RED);
  await page.getByLabel('Image fit').selectOption('actual');
  await page.getByLabel('Page size', { exact: true }).selectOption('letter');
  await page
    .getByLabel('Orientation', { exact: true })
    .selectOption('landscape');
  out = await output(page);
  expect(out.pdf.getPage(0).getSize()).toEqual({ width: 792, height: 612 });
  raster = await pixels(out.bytes);
  color(raster.at(330, 300), [255, 255, 255]);
  color(raster.at(350, 290), RED);
});
test('corrupt, fake, empty, malicious SVG and oversized headers are isolated from good files', async ({
  page,
}) => {
  for (const name of [
    'fake.jpg',
    'empty.png',
    'corrupt.jpg',
    'corrupt.png',
    'malicious.svg',
    'external.svg',
    'huge-dimensions.png',
  ]) {
    await page.getByLabel('Image file picker').setInputFiles(fixture(name));
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Choose images', exact: true }),
    ).toBeEnabled();
    await page.getByRole('button', { name: 'Dismiss errors' }).click();
  }
  await page
    .getByLabel('Image file picker')
    .setInputFiles([fixture('fake.jpg'), fixture('landscape.jpg')]);
  await expect(page.getByRole('button', { name: 'Create PDF' })).toBeEnabled();
  await expect(page.getByRole('alert')).toContainText('signature');
  expect((await output(page)).pdf.getPageCount()).toBe(1);
  expect(
    await page.evaluate(() => Reflect.get(globalThis, 'PIX2PDF_ATTACK')),
  ).toBeUndefined();
});
test('filenames are safe text, Unicode and duplicate inputs remain distinct', async ({
  page,
}) => {
  const bytes = await readFile(fixture('quadrants.png'));
  await page.getByLabel('Image file picker').setInputFiles([
    {
      name: '<img src=x onerror=alert(1)>.png',
      mimeType: 'image/png',
      buffer: bytes,
    },
    { name: '旅行.png', mimeType: 'image/png', buffer: bytes },
    { name: '旅行.png', mimeType: 'image/png', buffer: bytes },
  ]);
  await expect(page.locator('.image-card')).toHaveCount(3);
  await expect(page.locator('.card-meta img')).toHaveCount(0);
  await page.getByLabel('Output filename').fill('../bad\\name:<file>?.pdf');
  const out = await output(page);
  expect(out.name).toBe('bad-name--file.pdf');
  expect(out.pdf.getPageCount()).toBe(3);
});
test('safety limits, large images, tiny and extreme aspect ratios remain usable', async ({
  page,
}, info) => {
  const huge = info.outputPath('huge.jpg'),
    file = await open(huge, 'w');
  await file.truncate(40 * 1024 * 1024 + 1);
  await file.close();
  await page.getByLabel('Image file picker').setInputFiles(huge);
  await expect(page.getByRole('alert')).toContainText('40 MB');
  await upload(page, ['wide.png', 'tall.png', 'tiny.png', 'large.png']);
  await autoLayout(page);
  const out = await output(page);
  expect(out.pdf.getPageCount()).toBe(4);
  expect(out.pdf.getPage(0).getWidth()).toBe(1440);
  expect(out.pdf.getPage(1).getHeight()).toBe(1440);
  expect(out.pdf.getPage(2).getWidth()).toBe(0.75);
});
test('many images respect the page cap and cancel without losing the session', async ({
  page,
}) => {
  const bytes = await readFile(fixture('quadrants.png'));
  await page.getByLabel('Image file picker').setInputFiles(
    Array.from({ length: 51 }, (_, i) => ({
      name: `page-${i}.png`,
      mimeType: 'image/png',
      buffer: bytes,
    })),
  );
  await expect(
    page.getByRole('button', { name: 'Create PDF', exact: true }),
  ).toBeEnabled();
  await expect(page.locator('.image-card')).toHaveCount(50);
  await expect(page.getByRole('alert')).toContainText('50 pages');
  await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel processing' }).click();
  await expect(
    page.getByText('Conversion cancelled. Your images are ready to try again.'),
  ).toBeVisible();
  await expect(page.locator('.image-card')).toHaveCount(50);
  expect((await output(page)).pdf.getPageCount()).toBe(50);
});
test('drop, add, remove, clear, object URL revocation and refresh cleanup', async ({
  page,
}) => {
  await page.evaluate(() => {
    const original = URL.revokeObjectURL;
    Reflect.set(window, 'revoked', []);
    URL.revokeObjectURL = (url) => {
      (Reflect.get(window, 'revoked') as string[]).push(url);
      original(url);
    };
  });
  const data = await readFile(fixture('landscape.jpg'));
  const transfer = await page.evaluateHandle((base64) => {
    const dt = new DataTransfer();
    dt.items.add(
      new File(
        [Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))],
        'dropped.jpg',
        { type: 'image/jpeg' },
      ),
    );
    return dt;
  }, data.toString('base64'));
  await page
    .locator('.dropzone')
    .dispatchEvent('drop', { dataTransfer: transfer });
  await expect(page.locator('.image-card')).toHaveCount(1);
  await upload(page, ['quadrants.png']);
  await expect(page.locator('.image-card')).toHaveCount(2);
  await output(page);
  await page
    .getByRole('button', { name: 'Remove dropped.jpg, page 1' })
    .click();
  await expect(page.getByRole('link', { name: /Download/ })).toHaveCount(0);
  await expect(page.locator('.image-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear all images' }).click();
  await expect(page.locator('.image-card')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => (Reflect.get(window, 'revoked') as string[]).length,
    ),
  ).toBeGreaterThanOrEqual(3);
  await upload(page, ['landscape.jpg']);
  await page.reload();
  await expect(
    page.getByRole('button', { name: 'Choose images', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.image-card')).toHaveCount(0);
});
test('privacy: only static same-origin GETs, no sentinels, storage or CSP violations', async ({
  page,
}) => {
  const requests: { url: string; method: string; body: string }[] = [],
    errors: string[] = [];
  page.context().on('request', (r) =>
    requests.push({
      url: r.url(),
      method: r.method(),
      body: r.postData() ?? '',
    }),
  );
  page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluate(() => {
    Reflect.set(window, 'violations', []);
    document.addEventListener('securitypolicyviolation', (e) =>
      (Reflect.get(window, 'violations') as string[]).push(e.violatedDirective),
    );
  });
  const data = await readFile(fixture('landscape.jpg'));
  await page.getByLabel('Image file picker').setInputFiles({
    name: 'PRIVATE-SENTINEL-7c924b.jpg',
    mimeType: 'image/jpeg',
    buffer: data,
  });
  await expect(
    page.getByRole('button', { name: 'Create PDF', exact: true }),
  ).toBeEnabled();
  await output(page);
  // Exercise the worker and all lazy decoder imports under the same network policy.
  await upload(page, ['graphic.heic', 'graphic.tiff', 'animation.gif']);
  await output(page);
  expect(
    requests
      .filter((r) => !r.url.startsWith('blob:'))
      .every(
        (r) =>
          new URL(r.url).origin === 'http://127.0.0.1:4173' &&
          /\/assets\/[^/]+$/.test(new URL(r.url).pathname) &&
          r.method === 'GET' &&
          !r.body,
      ),
  ).toBe(true);
  expect(JSON.stringify(requests)).not.toMatch(
    /PRIVATE-SENTINEL|upload|analytics|telemetry/i,
  );
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => Reflect.get(window, 'violations'))).toEqual(
    [],
  );
  expect(
    await page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      db: (await indexedDB.databases()).length,
      cache: (await caches.keys()).length,
      sw: (await navigator.serviceWorker.getRegistrations()).length,
    })),
  ).toEqual({ local: 0, session: 0, db: 0, cache: 0, sw: 0 });
  await page.context().setOffline(true);
  await page.getByLabel('Margins').selectOption('none');
  expect((await output(page)).pdf.getPageCount()).toBe(4);
  await page.context().setOffline(false);
});
test('keyboard, light/dark accessibility and mobile conversion at 390 and 320 pixels', async ({
  page,
}, info) => {
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Skip to converter' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', { name: `Switch to ${theme} mode` }).click();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await upload(page, ['landscape.jpg', 'transparent.png']);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page
    .getByRole('button', { name: 'Move up transparent.png, page 2' })
    .click();
  await page
    .getByRole('button', { name: 'Rotate right transparent.png, page 1' })
    .click();
  await page.getByLabel('Page size', { exact: true }).selectOption('letter');
  expect((await output(page)).pdf.getPageCount()).toBe(2);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await page.screenshot({
    path: info.outputPath('mobile-dark.png'),
    fullPage: true,
  });
});
