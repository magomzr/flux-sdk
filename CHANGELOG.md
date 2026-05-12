# Changelog

## [0.5.0]
- Added `pollInterval: 0` support to disable polling — flags fetched once on initialize
- Added ETag / `If-None-Match` support to avoid processing unchanged responses (304)
- Updated Angular usage guide: simplified to direct `inject(FluxClient)` in components, removed global signal pattern

## [0.4.0]
- Added Angular usage guide to README with `app.config.ts` setup and reactive signals example

## [0.3.0]
- `onUpdate` callback in `FluxConfig` — called after each successful poll when flags have changed
- Flags are now compared before updating the cache, avoiding unnecessary updates when nothing changed
- Internal config type refactored to `ResolvedConfig` to properly handle optional `onUpdate` with `exactOptionalPropertyTypes`

## [0.2.0]
- Update documentation.
- Deploy on new tags.

## [0.1.0]
- Initial release
- `FluxClient` with `initialize()`, `isEnabled()`, `getVariant()`, `getAllFlags()`, and `destroy()`
- In-memory `FlagCache` with last-updated tracking
- `Poller` with recursive `setTimeout` to avoid overlapping fetches
- CJS and ESM builds via tsup
- TypeScript declarations included
