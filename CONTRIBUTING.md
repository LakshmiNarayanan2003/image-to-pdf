# Contributing

Changes should keep image bytes local, communicate format limitations honestly, and preserve keyboard/mobile access. Discuss substantial scope in an issue before implementation. Never attach private images; use generated reproductions.

## Start

Use Node 24.19.0 LTS, `npm ci`, then `npm run dev`. No secrets or backend are needed. In an isolated cloud task use the existing checkout; do not create a worktree unless explicitly requested.

Keep pure validation/layout logic separate from React, and put costly decoding in a cancellable local worker when practical. Use strict types, explicit ownership/cleanup and bounded concurrency. New formats require signature checks, a real fixture, a license review, resource limits and actual downloaded-PDF validation.

## Before a pull request

```sh
npm run format
npx playwright install --with-deps chromium firefox webkit
npm run verify
```

Record commands actually run, not intended checks. Include screenshots for UI changes. Update format/privacy/security docs when behavior changes. Do not update visual evidence merely to hide a regression.

`npm run fixtures` regenerates original artwork and ordinary fixtures. `npm run screenshots` captures the built UI. HEIC regeneration and restricted-cloud browser setup are described in [testing](docs/TESTING.md). Dependency upgrades must preserve signatures/TLS verification and update [third-party notices](THIRD_PARTY_NOTICES.md), including corresponding HEIC source archives when versions change.

Submit a focused PR with the concrete problem, resulting behavior and validation. Application contributions are under the repository’s MIT license. Third-party sources keep their original licenses. Follow the [code of conduct](CODE_OF_CONDUCT.md); use [security reporting](SECURITY.md) for vulnerabilities.
