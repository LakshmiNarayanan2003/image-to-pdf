# Changelog

All notable changes follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions follow semantic versioning.

## [0.1.0] - 2026-10-16

### Added

- Browser-local image-to-PDF conversion with pdf-lib; no backend, upload, telemetry or account.
- JPEG/PNG/WebP/BMP/SVG/ICO and browser-dependent AVIF; local GIF first-frame, HEIC primary-image and multi-page TIFF decoding.
- Preview, adding/removing images, desktop drag order, keyboard move controls and per-image quarter-turn rotation.
- Physical page presets, Match image sizing, orientation, fit/fill/original size, margins, backgrounds and three quality levels.
- EXIF orientation normalization, eligible JPEG direct embedding with metadata removal, filename sanitization and repeat downloads.
- Sequential work, bounded resources, progress, cancellation, per-file errors and URL/worker/canvas cleanup.
- Static SVG validation, restrictive CSP, no app persistence and network/privacy tests.
- Responsive light/dark UI, semantic controls, visible focus, reduced-motion support and automated accessibility checks.
- Original generated samples, edge fixtures, output-parsing/pixel tests, cross-browser tests and screenshots.
- CI, GitHub Pages workflow for master, contributor templates, dependency notices and decoder source archives.
