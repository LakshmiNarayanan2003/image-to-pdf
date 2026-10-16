# Verification record

Release: **Pix2PDF 0.1.0**, 2026-10-16. This record covers the local production artifact. No remote deployment success is asserted here.

## Environment

Debian 13, Node 24.19.0, npm 11.9.0, Playwright 1.64.1. Pinned engines: Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2. See [testing](TESTING.md) for the restricted-host library/profile setup.

## Executed release checks

| Check                                                | Observed result                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Clean `npm ci`                                       | Passed using the committed lockfile                                                            |
| TypeScript / ESLint / Prettier                       | Passed                                                                                         |
| Vitest unit/component tests                          | **93 passed**, 4 files; 0 failed/skipped                                                       |
| Playwright Chromium                                  | **36 passed**, 0 failed/skipped/flaky                                                          |
| Playwright Firefox                                   | **36 passed**, 0 failed/skipped/flaky                                                          |
| Playwright WebKit                                    | **36 passed**, 0 failed/skipped/flaky                                                          |
| Full browser suite                                   | **108 passed**, 119.6 seconds; zero retries locally                                            |
| axe and keyboard/mobile checks                       | Passed in both themes in all three engines; 390/320 px conversion exercised                    |
| Downloaded PDF parsing / independent pixel rendering | Passed across verified formats, EXIF, order, rotation, layouts and quality/backgrounds         |
| Network/storage/CSP privacy assertions               | Passed in all three browsers                                                                   |
| `npm audit --json`                                   | **0 vulnerabilities**, including development dependencies                                      |
| Production build and static/license checks           | Passed; 44 output files, 17 installed production-package notice entries                        |
| Documentation links                                  | Passed                                                                                         |
| Alternate `/pix2pdf/` production base                | Build and Chromium sample/download test passed                                                 |
| Fixture regeneration                                 | All sample and fixture SHA-256 values identical before/after                                   |
| Documentation screenshots                            | Seven real production captures; desktop and mobile themes visually inspected                   |
| Development-server browser smoke                     | Four samples loaded, heading rendered, zero browser errors after the serve-only CSP adjustment |
| Production regression after dev-only config fix      | Rebuilt HTML and every JS/CSS asset are SHA-256 identical to the fully browser-tested build    |

The complete `npm run verify` command passed with the documented cloud cache/browser environment variables. The development-only CSP fix was subsequently type/build checked and browser-smoke tested; byte-identical production output establishes that the tested release artifact did not change. [Machine-readable counts](verification-results.json) retain the actual Playwright totals and audit summary. Full local HTML/JSON reports are in ignored test output directories; CI uploads them as artifacts.

Verified actual formats: JPEG, PNG (including transparency), WebP, static SVG, BMP, GIF first frame, HEIC, TIFF (including multiple pages, LZW and deflate), PNG-backed ICO and AVIF. All eight JPEG EXIF orientation variants were exercised. See [format limitations](FORMAT_SUPPORT.md).

## GitHub status at release preparation

The authenticated repository API reports default branch `master`, private visibility and Pages disabled (`has_pages: false`). The integration returns HTTP 403, “Resource not accessible by integration,” for the Pages settings endpoint. Therefore Pages publication/configuration cannot be completed through these credentials. The deployment workflow is ready and invokes the full quality gate; enabling Pages with a suitable account/plan and verifying the live URL remain external checks. Repository visibility has not been changed.

## Manual and external checks

Physical iPhone/Android download dialogs, VoiceOver/NVDA, actual Edge/Safari installations, printer output and diverse real camera/HDR collections were not manually tested. The upstream HEIC native compiler chain was not independently rebuilt. Automated axe/keyboard tests are not accessibility certification. Generated-fixture codec results do not establish universal variant support.

GitHub Actions and live Pages publication must be observed separately after pushing. The Pages workflow is configured to deploy only after its full quality gate passes; repository-level Pages settings and remote results are not inferred from a successful local build.
