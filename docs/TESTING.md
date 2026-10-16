# Testing and reproduction

Use Node 24.19.0 and the committed npm lockfile. Test inputs are local generated fixtures; no remote photo API or conversion service is used.

```sh
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run verify
```

`npm run check` covers types, lint, formatting, unit/components, build, static/privacy/license validation and documentation links. `verify` adds npm audit and the full production-browser suite. Browser installation is a one-time host prerequisite and may require administrator access for system libraries.

## Coverage

- Vitest tests signatures, misleading names/MIME, caps, SVG rejection, EXIF parsing, filenames, ordering, geometry, PDF parsing and component controls.
- Playwright operates the built app, selects actual files, downloads bytes, loads the PDF with pdf-lib, and rasterizes it independently with PDF.js and a Node canvas. PDF metadata is loaded with `updateMetadata: false` so parser defaults cannot replace the values under test.
- Known color quadrants detect page order, rotations/mirrors, scaling, clipping, margins, alpha background and decoder correctness. Lossy codecs use explicit color tolerances; content is checked away from antialiased boundaries.
- All three projects exercise the sample flow, formats, multi-TIFF, eight EXIF orientations, quality/backgrounds, order, desktop drag, fixed layouts, errors/recovery, filenames, large/tiny/aspect cases, 50-page bound, cancellation, cleanup, privacy, keyboard, dark mode, axe and 390/320 px layouts.
- The privacy test records requests and browser exceptions, verifies that sentinel filenames/data do not leave through requests, checks storage and regenerates a PDF offline after all required bundles have loaded. Static checks independently forbid unexpected network/storage primitives and unsafe CSP allowances.
- Accessibility checks run axe in both themes and exercise keyboard controls. They do not certify WCAG conformance or replace screen-reader testing.

Playwright reports appear in ignored `playwright-report/` and `test-results/`; failure traces and screenshots are retained. CI uploads evidence as artifacts. Local tests have zero retries; CI permits one retry for diagnosis, and reports expose retried/flaky tests.

## Fixture generation

```sh
npm run fixtures
```

This creates original application samples and test files with Sharp plus small explicit encoders for TIFF/BMP/ICO. HEIC regeneration is optional; the genuine tested fixture is already committed:

```sh
python3 -m venv /tmp/pix2pdf-fixtures
/tmp/pix2pdf-fixtures/bin/pip install Pillow==12.3.0 pillow-heif==1.3.0
/tmp/pix2pdf-fixtures/bin/python scripts/generate-heic-fixture.py
```

The fixture set includes unsupported/empty/corrupt/oversized headers, malicious SVG, Unicode names, extreme dimensions, GIF animation, transparent PNG, multipage TIFF and EXIF mirror/rotation cases. HEIC and all art originate from the generated quadrant image, with no external photograph license dependency.

## Real screenshots

```sh
npm run build
npm run screenshots
```

The script launches production preview when needed, uses installed Playwright Chromium, selects real samples, builds a PDF and captures seven states under `docs/images/`: empty desktop light/dark, populated workspace light/dark, PDF-ready, mobile light/dark. Screenshots are actual output, not design mockups. They are documentation evidence rather than fragile pixel-equality test baselines. OS fonts can affect text rendering.

## Restricted cloud host used for this release

The release environment is Debian 13 with Node 24.19.0/npm 11.9.0. Its default npm cache is not writable, so use `npm_config_cache=/tmp/pix2pdf-npm-cache` for npm installs/audits. Browser executables live under `/workspace/.cache/ms-playwright`:

```sh
PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright \
PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=1 npm run test:e2e
```

This host lacks a privileged system-package installer. Required WebKit libraries were downloaded from signed Debian repositories, extracted to a workspace cache, and linked into the browser's library directories. The host-validation override skips Playwright's global `ldconfig` precheck, which cannot see those local libraries; it does not skip browser tests, disable browser isolation or bypass package integrity. All three browsers actually launched and executed conversions. Firefox additionally required the execution environment's approved expanded process permissions to access its temporary profile. These host-specific workarounds are unnecessary in CI, which uses the normal `playwright install --with-deps` path.

## Troubleshooting

- A decoder download failure on first use: reconnect and retry; lazy same-origin bundles are needed before offline conversion.
- Unsupported file: export PNG/JPEG, or simplify an SVG. File extension renaming does not change the codec.
- Memory pressure: reduce page count/resolution; a limit check cannot prevent every browser allocation failure.
- Stale preview: stop your prior preview before testing a different base path. CI starts its own production server.
- Download spaces become underscores in WebKit: browser filename behavior; PDF title and app download attribute retain the sanitized chosen name.
- Native decoder colors differ slightly: browsers color-convert inputs and lossy outputs are approximate; preserve original files for archival use.

See [observed results](VERIFICATION.md) and [manual checks](VERIFICATION.md#manual-and-external-checks).
