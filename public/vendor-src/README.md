# HEIC decoder corresponding source

Pix2PDF 0.1.0 uses `libheif-js@1.23.5`. The adjacent archives preserve exact upstream Git trees; `manifest.json` identifies commits and SHA-256 hashes. They contain original upstream source, not generated user images. Their licenses remain upstream licenses.

- `libheif-1.23.5.tar.gz`: libheif C/C++ and Emscripten bindings, commit `413e2a87e6a70b3eccc3a3adc5801179dd2d9e00` from strukturag/libheif.
- `libde265-1.0.15.tar.gz`: HEVC decoder, tag v1.0.15, from strukturag/libde265.
- `libheif-emscripten-v1.23.5.tar.gz`: exact upstream build recipe and CI configuration from catdad-experiments/libheif-emscripten. Its libheif submodule is supplied separately above.
- `libheif-js-1.23.5.tar.gz`: npm wrapper/bundling scripts from catdad-experiments/libheif-js, commit recorded in the manifest.

## Rebuild or replace

The full application source is at https://github.com/LakshmiNarayanan2003/image-to-pdf. Clone it, use Node 24 LTS, and run `npm ci`.

To rebuild the native library, extract the libheif and libde265 source archives. The upstream Emscripten workflow is included under `.github/workflows/emscripten.yml` in the build-recipe archive. It uses Emscripten 3.1.61; inspect the supplied `build-emscripten.sh`, `scripts/install-ci-linux.sh`, `scripts/prepare-ci.sh`, and `scripts/run-ci.sh` for system build prerequisites. Install an official Emscripten toolchain and the documented CMake/Autotools/Python toolchain, then create a separate build directory. Its core invocation is:

```sh
USE_WASM=1 USE_UNSAFE_EVAL=0 USE_TYPESCRIPT=1 LIBDE265_VERSION=1.0.15 /path/to/libheif/build-emscripten.sh /path/to/libheif
```

The script can download a libde265 source release from its authoritative upstream; the exact Git source is also distributed here. No AOM or encoder is required for this HEIC path. Use the wrapper's included `scripts/install.js`/`scripts/bundle.js` to package the rebuilt JS/WASM as `libheif-wasm/libheif-bundle.mjs`. The original upstream distribution recipe is included so recipients can reproduce or adjust it.

For application relinking, replace the installed `node_modules/libheif-js/libheif-wasm/libheif-bundle.mjs` with the interface-compatible rebuilt module and run `npm run build`. The worker adapter in `src/lib/image/decoder.worker.ts` documents the interface. Keep that module’s exported factory/API, bundle all code locally, preserve CSP, and rerun real HEIC conversion tests. A private fork may instead use a local package override, with a new lockfile and corresponding source record. Nothing checks a proprietary signature or prevents replacing the library.

The app’s 0.1.0 verification used the registry artifact with lockfile integrity, not a locally rebuilt Emscripten binary. These are the upstream build instructions, not a claim that the complete native rebuild was executed here.

GPL/LGPL license texts and copyright notices are in the adjacent `../notices/` directory. The root application's THIRD_PARTY_NOTICES.md describes the distribution terms and independent MIT application code.
