import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const base = process.env.VITE_BASE_PATH || '/image-to-pdf/',
  url = `http://127.0.0.1:4173${base}`;
let server;
try {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Preview unavailable');
  } catch {
    server = spawn(
      process.execPath,
      [
        'node_modules/vite/bin/vite.js',
        'preview',
        '--host',
        '127.0.0.1',
        '--port',
        '4173',
        '--strictPort',
      ],
      { stdio: 'ignore' },
    );
    let ready = false;
    for (let i = 0; i < 60; i++) {
      try {
        if ((await fetch(url)).ok) {
          ready = true;
          break;
        }
      } catch {
        /* Wait for the preview process to listen. */
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    if (!ready) throw new Error('Preview did not start');
  }
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  );
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1040 },
      deviceScaleFactor: 1,
      colorScheme: 'light',
      reducedMotion: 'reduce',
    });
    await mkdir('docs/images', { recursive: true });
    await page.goto(url);
    const capture = async (name) => {
      await page.screenshot({
        path: `docs/images/${name}.png`,
        fullPage: true,
      });
    };
    await capture('desktop-light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await capture('desktop-dark');
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.getByRole('button', { name: 'Try sample images' }).click();
    await page.locator('.image-card').last().waitFor();
    await page
      .getByRole('button', { name: 'Create PDF', exact: true })
      .waitFor();
    await page
      .locator('.thumbnail-stage img')
      .evaluateAll((images) =>
        Promise.all(images.map((image) => image.decode())),
      );
    await capture('workspace-light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await capture('workspace-dark');
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
    await page.getByRole('button', { name: 'Create PDF', exact: true }).click();
    await page
      .getByRole('link', { name: 'Download PDF', exact: true })
      .waitFor();
    await capture('success');
    await page.setViewportSize({ width: 390, height: 844 });
    await capture('mobile-light');
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await capture('mobile-dark');
    console.log(
      'Captured seven real app screenshots, including both themes, mobile and PDF success.',
    );
  } finally {
    await browser.close();
  }
} finally {
  server?.kill('SIGTERM');
}
