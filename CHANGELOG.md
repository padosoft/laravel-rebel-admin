# Changelog

All notable changes to `padosoft/laravel-rebel-admin` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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
