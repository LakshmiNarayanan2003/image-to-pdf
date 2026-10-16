# Third-party notices

Pix2PDF application code is MIT © 2026 Lakshmi Narayanan Sridharan. Design conventions were adapted from the same owner’s MIT-licensed [PDF2Pix](https://github.com/LakshmiNarayanan2003/pdf-to-image); its PDF rendering/export logic was not copied into the image conversion pipeline. Preserve the [application license](LICENSE).

## Runtime dependencies

The committed lockfile records exact versions and integrity hashes. `npm run build` generates `public/licenses/index.json` and copies every installed production package’s available license/notice files into the built `licenses/` directory. These notices travel with the deployable site.

| Component            | Version reviewed | License / role                                        |
| -------------------- | ---------------- | ----------------------------------------------------- |
| React / React DOM    | 19.3.1           | MIT; UI                                               |
| Lucide React         | 1.58.0           | ISC; icons, with upstream notices retained            |
| pdf-lib              | 1.17.1           | MIT; PDF creation                                     |
| tiff                 | 7.1.3            | MIT; local TIFF parsing/decoding                      |
| gifuct-js            | 2.1.2            | MIT; GIF parsing and first-frame decode               |
| libheif-js / libheif | 1.23.5           | LGPL-3.0; lazy HEIC decoder                           |
| libde265             | 1.0.15           | LGPL-3.0; HEVC decoding inside the libheif WASM build |

Transitive notices include @pdf-lib/upng and standard-fonts (MIT), pako (MIT AND Zlib), fflate (MIT), iobuffer (MIT), js-binary-schema-parser (MIT), scheduler (MIT), tslib (0BSD), and TypeScript-related peer package notices. These do not imply all installed code is shipped by Vite.

Development-only tools include Vite/Vitest, TypeScript, ESLint/Prettier, Playwright, axe, Testing Library, sharp, pngjs, PDF.js and @napi-rs/canvas. They are not conversion runtime services. Python Pillow/pillow-heif optionally generate the synthetic HEIC fixture; they are not shipped to browsers. Codec patent rights, where applicable, are distinct from copyright licenses.

## LGPL evaluation and distribution

HEIC decoding cannot presently be provided with a comparably established permissive-only HEVC decoder in this application. The maintained libheif stack is LGPL, so it is used as an independently loaded library with complete notices and corresponding source. The application remains MIT. No GPL/AGPL application logic or HEVC encoder is bundled. The upstream Emscripten recipe enables libde265, disables AOM by default, and builds without JavaScript unsafe-eval.

The static distribution includes:

- [GNU GPL v3](public/notices/GPL-3.txt) and [GNU LGPL v3](public/notices/LGPL-3.txt).
- [libheif copyright/license](public/notices/libheif-COPYING.txt) and [libde265 copyright/license](public/notices/libde265-COPYING.txt).
- Original, unmodified library source and build/wrapper source in [public/vendor-src/manifest.json](public/vendor-src/manifest.json), with exact Git commits and SHA-256 archive hashes.
- [Rebuild/replacement instructions](public/vendor-src/README.md). The application source is available in this repository, including its lockfile and worker integration, so recipients can relink/rebuild with an interface-compatible modified library.

Users may inspect, modify, replace and reverse-engineer the LGPL library for debugging their modifications. Nothing in the application license or distribution prohibits that. Build-time minification and bundling do not remove these rights. The decoder chunk can be regenerated from corresponding source and rebuilt into the app; there is no signing lock or server dependency.

Source archive checks run in `npm run check:assets`. A future libheif upgrade must replace the corresponding source, notices and version record together. Rebuilders must retain all notices and source obligations when redistributing the combined work.
