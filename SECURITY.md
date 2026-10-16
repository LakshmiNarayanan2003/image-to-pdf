# Security

Pix2PDF 0.1.x is the initial supported development line. Keep browsers and dependencies current. CI audits npm dependencies and Dependabot proposes updates. A clean audit is useful evidence, not proof of safety.

## Reporting

Use GitHub **Security → Report a vulnerability** on this repository when available. If private reporting is unavailable, use a private contact method the owner provides on their GitHub profile. Do not publish sensitive images or exploit details in an ordinary issue. Provide a minimal synthetic reproduction, browser version and affected revision. No response SLA is claimed.

## Trust boundaries

All input bytes, MIME declarations, extensions, filenames and metadata are untrusted. Magic signatures choose a decoding route; extensions only identify known exclusions and MIME types reject obviously non-image documents. A renamed PNG may safely become PNG despite a `.jpg` name. A signature is not proof a file is safe.

Native image decoders and bundled libheif, tiff and gifuct-js parse untrusted content. File limits, dimension preflight, bounded TIFF directory chains/metadata, page caps and worker timeouts reduce risk. Workers isolate responsiveness and can be terminated, but are not a separate security origin or protection against a browser exploit. Native decoding and third-party parsers can still allocate memory beyond encoded size.

Filename rendering uses React text. Generated download names remove separators, control/bidi characters and unsafe punctuation, enforce `.pdf` and a nonempty bounded stem. PDFs contain image streams, layout operators and minimal metadata; no JavaScript, links, attachments or user filesystem paths are inserted.

## SVG threat model

Uploaded XML is parsed with DOMParser into an **unattached XML document**, never inserted into the live DOM. It must be an SVG-namespace root. The app rejects DTD/entity declarations, parser errors, unknown elements and attributes, scripts, event handlers, foreignObject, animation, use, CSS/style, image/href resources, nonfragment URLs and external fonts. An explicit allowlist permits basic paths/shapes/text, gradients and clipping. Limited `url(#id)` references may target local definitions only. Source size, node count and dimensions are bounded.

Only the validated root is serialized to a Blob and loaded through the browser’s noninteractive **image context**, then rasterized to PNG. No `innerHTML` path exists. The restrictive CSP is a second barrier. Malicious-script and external-reference SVG fixtures are rejected in real browsers; pure tests cover additional SVG payloads. This intentionally rejects some legitimate complex SVGs. Export those as PNG rather than weakening the boundary.

## Decoder licensing and integrity

Dependencies are installed from a committed lockfile with registry integrity hashes and TLS checks. The HEIC library is a pinned LGPL dependency, not a remote service. Its source archives and SHA-256 manifest ship with the site; see [third-party notices](THIRD_PARTY_NOTICES.md). No GPL/AGPL application code was imported. LGPL library use is explicitly evaluated and accompanied by corresponding source and relinking instructions.

## CSP and hosting

The document CSP uses `default-src 'self'`, local scripts/styles/workers/connections, blob/data images, `object-src 'none'`, `frame-src 'none'`, `form-action 'none'` and `base-uri 'self'`. `wasm-unsafe-eval` is required by local libheif WebAssembly; JavaScript eval remains blocked. No inline script/style permission is granted in the production document.

GitHub Pages does not expose arbitrary response headers; `frame-ancestors` cannot be enforced in a meta CSP. A different host may add response-header CSP, anti-framing and other headers. Vite development tooling is not the production security boundary. No secrets belong in this static site.

See [privacy](PRIVACY.md) for residual risks and [testing](docs/TESTING.md) for the limits of automated assurance.
