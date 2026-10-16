# Privacy architecture

Pix2PDF 0.1.0 is a static, browser-local application. It has no backend, conversion endpoint, analytics, telemetry, authentication or account system.

## Exact data flow

1. The File API exposes the images the user selects or drops. Application code reads bytes in memory.
2. Signatures, file sizes and practical header dimensions are checked. Native decoders or same-origin worker code decode locally. SVG is validated as a restricted static subset before image-context rasterization.
3. Normalized PNG Blobs, bounded thumbnail Object URLs and optional metadata-stripped JPEG bytes remain in memory. TIFF pages are separate entries; each source’s input bytes count once.
4. pdf-lib embeds images into PDF pages sequentially. Layout, backgrounds, quality and rotation are applied locally. Metadata contains a sanitized output title and Pix2PDF creator/producer; source names and paths are not PDF metadata.
5. A PDF Blob/Object URL is created. The user clicks Download PDF. The browser saves it locally and may ask where to put it. Download again reuses the same Blob until the session changes.
6. Removal, clear, changed options, another operation or component disposal revoke stale URLs. Canvases are reset; ImageBitmaps close; decoder workers terminate on success, error, timeout or cancellation. Refresh/navigation starts empty.

Images, filenames, output data and theme preferences are not stored in localStorage, sessionStorage, IndexedDB, Cache Storage or cookies. No service worker exists. The browser may cache **public static code and sample assets** according to HTTP behavior; the app never puts user images in an HTTP response cache.

## Network behavior

Initial navigation downloads the site’s HTML, JS, CSS and icon. PDF generation and GIF/TIFF/HEIC workers load code on demand from the same origin. libheif’s WASM is embedded in its local JS chunk. There is no runtime CDN, remote font or remote conversion call.

The sample button issues GETs for four fixed filenames under the site’s `samples/` path. Those files are public application artwork, not selected user files. User names and bytes are not used in URLs, request bodies, XHR, WebSocket or beacon calls. Links to GitHub and PDF2Pix navigate only when clicked and carry no image data.

The meta CSP limits scripts/styles/workers/connections to self, permits local blob/data images and local WASM compilation, and blocks forms, frames and plugins. It contains no JavaScript `unsafe-eval` or inline-style allowance. CSP cannot by itself prevent malicious same-origin code from sending data; source review and network tests are also required.

Once required bundles are loaded, already prepared image conversion works with networking disabled. A cold first use of a lazy decoder may need connectivity. Reloading offline is not promised.

## Boundaries

GitHub Pages/static hosting and network infrastructure see ordinary asset requests, IP addresses and connection metadata. Browser extensions, a compromised browser or build, operating-system swap/pagefiles, screenshots, developer tools and downloads are outside the JavaScript application’s control. JavaScript cannot wipe memory byte-for-byte. Garbage collection and process exit reclaim references, not a certified erasure process.

The downloaded PDF remains because the user explicitly saved it. Native decoders may manage caches or color profiles internally. App-level metadata removal does not guarantee forensic anonymity: recognizable image content remains in the PDF.

## Automated evidence

Cross-browser tests select a uniquely named sentinel image, convert/download it, then exercise each local worker decoder. They record requests and require only same-origin static GETs with no bodies or filename sentinel, empty app storage, no registered service worker, and no CSP violations. Tests also convert after disconnecting the browser context and inspect cleanup after clear/refresh.

These tests cover the tested build and fixtures, not every future dependency, browser extension, hostile decoder exploit or future deployment. See [verification](docs/VERIFICATION.md).
