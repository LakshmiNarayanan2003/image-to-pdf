# Engineering decisions

| Decision                             | Reason and consequence                                                                                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React, strict TypeScript, Vite       | Small static application with typed image/session boundaries and reliable subpath builds. No server framework is needed.                                                                         |
| Local CSS and system fonts           | Matches the PDF2Pix sibling's green/serif visual language without runtime font requests or a large UI framework.                                                                                 |
| pdf-lib                              | Maintained browser-compatible PDF construction, embedding, physical geometry and clipping. PDF.js is test-only and independently renders downloaded output.                                      |
| Canonical oriented PNG               | Consistent thumbnails and PDF input across native and worker decoders. Costs memory, so page/source/pixel/retained-byte limits are explicit.                                                     |
| Eligible original JPEG at Maximum    | Avoids another lossy encode; EXIF/ICC/non-RGB cases instead use normalized pixels. Metadata is stripped. Maximum is not an archival-equivalence promise.                                         |
| Native common-format decoders        | Uses mature platform implementations. AVIF/ICO and unusual variants remain conditional on actual browser support.                                                                                |
| gifuct-js first-frame decode         | Deterministic animation behavior rather than a timing-dependent canvas snapshot. GIF animation does not create multiple PDF pages.                                                               |
| `tiff` decoder with header preflight | Standard TIFF expansion with typed maintained code. Deliberately rejects unsupported variants, nested metadata IFDs and RAW/DNG. Test fixtures cover uncompressed, LZW and deflate.              |
| libheif-js WASM, lazy worker         | Real local HEVC/HEIC decoding across tested engines. Adds about 2 MB to the lazy bundle and LGPL distribution obligations. Ships original notices, source archives and replacement instructions. |
| Strict SVG allowlist                 | Rejects active/external content before rasterization. Some legitimate complex SVG artwork is unsupported; exporting PNG is the recovery path.                                                    |
| No persistence or service worker     | Clear session lifetime and no document history. First use of a lazy decoder requires its same-origin asset; offline startup is not guaranteed.                                                   |
| Sequential decoding and PDF assembly | Bounded concurrent work and useful per-file progress; lower throughput than fully parallel processing.                                                                                           |
| Multiple complementary test layers   | Pure geometry checks, rendered component behavior, real downloaded PDF parsing and independent pixel checks catch different classes of defects.                                                  |

## HEIC licensing and reproducibility

The application is MIT. libheif-js, libheif and libde265 include LGPL-3.0 terms. These are disclosed rather than relabeled as MIT. The exact upstream Git trees for the installed decoder/build chain are distributed in `public/vendor-src`, with hashes, notices and instructions for rebuilding/replacing the local decoder. The upstream native/WASM compiler chain was inspected but not independently rebuilt during this release. The installed npm artifact is pinned by the lockfile integrity value and executed in real browser tests. See [third-party notices](../THIRD_PARTY_NOTICES.md).

## Limits of the evidence

Generated images make orientation, clipping and compression assertions reproducible. They do not represent every camera, codec, HDR profile or malformed container. Automated accessibility tests include keyboard and axe, but physical-device screen-reader and print review remain human checks. No remote deployment is reported successful without an observed run.
