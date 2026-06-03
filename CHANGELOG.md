# Changelog

All notable changes to `padosoft/laravel-rebel-admin` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.6] - 2026-06-03

### Changed
- **Audit detail shows country / IP / User-Agent.** The Audit Explorer now surfaces the real
  `country` (from the captured CF-IPCountry header), the masked IP hash and the User-Agent
  hash from the live API, instead of placeholders. Channel Performance shows delivered-rate /
  cost once the provider's delivery webhook reports them. Requires admin-api >= 0.1.6.

## [0.1.5] - 2026-06-03

### Changed
- **Compliance AMR + Device & Session Trust now use live data.** The panel reads the real AMR
  distribution from `compliance/overview`, and the Device & Session section is backed by the
  Admin API's `subjects` list + `subjects/{id}/devices|sessions` (real devices/sessions) instead
  of the template's sample rows. Requires `laravel-rebel-admin-api` ≥ 0.1.5.

## [0.1.4] - 2026-06-03

### Changed
- **Honest channel/provider widgets.** The panel no longer falls back to the template's
  illustrative sample for Channel Performance and Provider Health — it shows exactly what the
  Admin API reports (zeros / empty until real delivery telemetry is captured), so the panel
  never implies traffic that doesn't exist. Empty trend series are drawn as flat-zero lines
  (valid SVG) instead of breaking the chart.

## [0.1.3] - 2026-06-03

### Changed
- **Full panel UI.** Replaced the simplified Blade widget shell with the complete admin SPA
  (ported from the design template): grouped sidebar (Monitor / Investigate / Intelligence),
  tenant switcher, period selector, ⌘K command palette, live pill, theme toggle, and all ten
  sections (Security Overview, OTP & Step-up funnels, Channel Performance, Provider Health,
  Audit Explorer, Device & Session Trust, Risk Rules + simulator, Anomaly Detection, AI Copilot,
  Compliance Center) with KPI cards, charts, drawers and toasts.
- The panel now hydrates from the **live Admin API** (`laravel-rebel-admin-api` ≥ 0.1.3):
  overview KPIs/timeseries/funnel, risk rules (read + **persist a draft**), anomalies,
  compliance, step-up funnels, channels and audit events — with the template's illustrative
  sample data kept only where an endpoint has no telemetry yet, so no widget ever breaks.

### Build
- `build.mjs` produces a single self-contained `resources/dist/rebel-admin.js` (production React
  UMD + the app, JSX stripped by pure-JS Babel) — no CDN, no native bundler required.

## [0.1.2] - 2026-06-03

### Fixed
- **Risk Rules section 404**: the sidebar links to each section's URL `path`, but the route
  resolved the `{section}` segment against the section `key`. Every section had `key === path`
  except "Risk Rules" (`key='risk'`, `path='risk-rules'`), so `/admin/rebel/risk-rules` 404'd.
  `Sections::find()` now resolves by `key` **or** `path`; added a test that walks every
  sidebar URL and asserts it renders.

## [0.1.1] - 2026-06-03

### Fixed
- **Panel asset 404**: the panel shell referenced `vendor/laravel-rebel-admin/rebel-admin.{css,js}`,
  but `spatie/laravel-package-tools` publishes `hasAssets()` to `public/vendor/rebel-admin/`
  (the short name strips the `laravel-` prefix). The stylesheet and script returned 404 in a real
  app. The view now points at `vendor/rebel-admin/...`; added a regression test pinning the path.

## [0.1.0] - 2026-06-03

### Added
- **Panel shell**: topbar (brand, tenant switcher, period selector, theme toggle, user),
  sidebar with all 10 control-plane sections, and a content area that hydrates client-side.
- **Design tokens** (light/dark, Bootstrap-compatible CSS variables) + reusable component
  styles (cards, tables, skeleton/empty/error states, toasts).
- **`RebelAdmin` JS client**: `AbortController`-based fetch to the Admin API with explicit
  loading / empty / error states; theme toggle; tenant/period context re-hydration.
- **Live sections**: Security Overview and Audit Explorer hydrate from the real
  `laravel-rebel-admin-api`. The other sections render a clear "endpoint pending" state
  until their Admin API endpoints ship.
- **Fail-closed access**: `EnsurePanelAccess` redirects anonymous visitors to login and
  requires the (default) `rebel-admin` Gate ability.
- Config file, publishable views + assets, CI matrix (PHP 8.3/8.4/8.5 × Laravel 12/13),
  Pest feature suite, PHPStan level max, Pint.

[Unreleased]: https://github.com/padosoft/laravel-rebel-admin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/padosoft/laravel-rebel-admin/releases/tag/v0.1.0
