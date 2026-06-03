# CLAUDE.md — AI working guide for `padosoft/laravel-rebel-admin`

> Working on this package with an AI agent (Claude Code, Cursor, Copilot, Codex)? Read this first.
> It's the "batteries" that make vibe-coding here land on the first try. Plain Markdown — every
> tool can read it.

## What this package is
Web Admin Panel for Laravel Rebel: a security-operations dashboard (SPA) served by Laravel over the Rebel Admin API.

Part of the **Laravel Rebel** suite — an enterprise authentication control plane over Laravel
Fortify. The shared language (value objects, contracts, the audit trail) lives in
`padosoft/laravel-rebel-core`; this package builds on it. It is a thin front-end: all data comes
from `padosoft/laravel-rebel-admin-api`.

## Non-negotiable conventions
- `declare(strict_types=1);` in every PHP file; `final` classes; constructor property promotion.
- **PHPStan level max** must stay green. Do NOT add `@phpstan-ignore`, baseline entries, or
  `assert()`/inline `@var` to silence errors — fix the root cause. Common recipes:
  - narrow `mixed` before casting: `is_scalar($x) ? (string) $x : null`;
  - `json_decode($s, true)` is `array<array-key, mixed>`;
  - the container's `make('request')` is already typed `Illuminate\Http\Request`;
  - use `cursor()` for large scans, `withoutGlobalScopes()` for cross-tenant admin reads;
  - nested Eloquent `where(fn ($q) => …)` closures receive `Illuminate\Database\Eloquent\Builder`.
- **Tests:** Pest, Testbench. Cover happy path, auth/fail-closed, tenant-scoping, empty state.
- **Style:** Pint (`composer pint`). **Docs/comments in English.**
- Package wiring uses `spatie/laravel-package-tools` (`configurePackage`).

## Security & telemetry rules (suite-wide)
- Never store PII in cleartext: identifiers, IPs and User-Agents are **keyed HMACs** (core
  `KeyedHasher`). Never log OTPs/secrets (the `Redactor` sanitizes audit metadata).
- **Telemetry completeness:** if this package is a channel/driver/bridge/provider, it MUST capture
  everything that fills the admin panel (sends, **delivery receipts**, cost, country, devices,
  anomalies…). Record through the core `AuditLogger` contract — it persists to `rebel_auth_events`
  (never session) and supports **configurable sync|queue** dispatch (Horizon-ready). Skip a field
  only when the driver genuinely can't supply it, and surface an honest empty state — never fake data.

## Front-end architecture (read before touching the panel)
The panel is a **React 18 SPA** rendered client-side, not Blade widgets. There is **no native
bundler** on the build host: `build.mjs` is a pure-JS pipeline — `@babel/standalone` (pure JS)
strips JSX from the concatenated source and the **React + ReactDOM production UMD** builds are
prepended, producing two self-contained, CDN-free assets in `resources/dist/`
(`rebel-admin.js`, `rebel-admin.css`). Run it with `node build.mjs` (npm script `build`).
- **Entry / components:** `resources/js/panel/main.jsx` (the app + all widgets).
- **API layer:** `resources/js/panel/api.js` — `build.mjs` injects it before the app entry; it
  replaces the template's mock `RebelData` with `window.RebelApi` fetches against the Admin API base
  (`window.RebelAdminBoot.apiBase`, default `/rebel/admin/api/v1`), defensively keeping the sample
  value when an endpoint is empty so no widget ever breaks.
- **Server side:** the Blade host is `resources/views/panel.blade.php`, served by
  `Http\Controllers\PanelController` behind `Http\Middleware\EnsurePanelAccess`; nav lives in
  `Panel\Sections`.

## How to extend it
- **Add a page/widget:** add the React component in `resources/js/panel/main.jsx`, register it in
  `Panel\Sections` if it's a new nav section, then **map the data** by adding an endpoint call in
  `resources/js/panel/api.js` (use `RebelApi.get/post/...`). Rebuild with `node build.mjs` and
  commit the regenerated `resources/dist/*`.
- **Wire a new Admin API endpoint:** add it to the `RebelApi`/`RebelData` mapping in `api.js`; if the
  endpoint doesn't exist yet, add it in `padosoft/laravel-rebel-admin-api` first.
- **Gate/route:** adjust `EnsurePanelAccess` / `PanelController` for access or route changes.

## Definition of Done (per change)
1. Red→green with Pest; `composer phpstan` (max) + `composer pint -- --test` clean. Rebuild the SPA
   (`node build.mjs`) and commit `resources/dist/*` when front-end changed.
2. One feature branch, one PR to `main`. CI matrix **PHP 8.3/8.4/8.5 × Laravel 12/13** must be green.
3. Update `README.md` + `CHANGELOG.md`. Squash-merge.
4. **Release:** `git tag vX.Y.Z && git push origin vX.Y.Z` + `gh release create`. Stay in `0.1.x`
   (Composer `^0.1` excludes `0.2.0` and would break dependents).

## Skills
This repo ships invocable skills under `.claude/skills/` — at least `rebel-package-dev` (the dev
loop + PHPStan-max recipes). Invoke it before non-trivial work.

---

> **Operational rules (Italian):** see **`AGENTS.md`** for the full workflow contract (branching,
> Definition of Done, local loop + GitHub gates, guardrails, didactic READMEs, design-lock), plus
> the `docs/` planning files (`LESSON.md`, `PROGRESS.md`, `IMPLEMENTATION-PLAN.md`) when present.
