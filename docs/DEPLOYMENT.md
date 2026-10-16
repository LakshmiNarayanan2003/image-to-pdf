# Deployment

The repository is `LakshmiNarayanan2003/image-to-pdf`; its default branch is `master`. The configured site URL is `https://lakshminarayanan2003.github.io/image-to-pdf/`.

## GitHub Actions and Pages

`.github/workflows/ci.yml` runs for pushes and pull requests and is reusable by deployment. It uses Node from `.nvmrc`, a lockfile install, types/lint/format/unit tests, a production build, static/privacy/license checks, documentation links, dependency audit and Chromium/Firefox/WebKit tests against production preview. Reports are uploaded even after failures. It preserves the default-path site artifact, then builds and smoke-tests `/pix2pdf/` as an alternate deployment base.

`.github/workflows/deploy.yml` runs on pushes to `master` and manual dispatch on `master`. It calls the full quality workflow, downloads that verified artifact and deploys through the official Pages actions. Pull requests cannot publish. The deploy job alone receives `pages: write` and `id-token: write`; other jobs have read-only repository access. Concurrent Pages deploys are serialized.

The repository's Pages build source must be **GitHub Actions** in Settings → Pages. No application secrets are needed. A workflow file cannot itself prove that the repository-level Pages setting is enabled. The release verification record distinguishes local success from remote run/publication status.

## Local preview

```sh
npm ci
npm run build
npm run preview -- --port 4173 --strictPort
```

Open `http://localhost:4173/image-to-pdf/`. `dist/` is the complete static deployment, including licenses and corresponding decoder sources. Do not deploy only `index.html` or strip worker/source-notice assets.

## Other static hosts

```sh
VITE_BASE_PATH=/pix2pdf/ npm run build
VITE_BASE_PATH=/pix2pdf/ npm run test:e2e -- --project=chromium --grep 'sample workflow'
```

For a domain root, set `VITE_BASE_PATH=/`. If changing the public canonical location, also update the canonical/OG URL in `index.html`, `package.json` homepage, `public/sitemap.xml`, `public/robots.txt` and documentation. The build-base override deliberately does not rewrite repository identity. There are no client-side routes requiring a catch-all rewrite.

The HTML includes a restrictive CSP. Hosts supporting response headers can additionally enforce an equivalent CSP, `X-Content-Type-Options: nosniff` and a suitable referrer policy. GitHub Pages does not offer arbitrary custom response headers, so do not claim headers it cannot emit.

Vite's development server removes the CSP meta tag to support injected styles and live reload. Always use the production build/preview to verify the deployed security policy; the serve-only plugin does not change build output. Do not expose a development server as a production deployment.

## Release review

Inspect the remote Actions run, Pages environment URL and live asset loads after publishing. Download a small PDF from the deployed site. Local browser checks establish correctness of the artifact; they do not prove a host's configuration, cache state or successful publication. See [verification](VERIFICATION.md).
