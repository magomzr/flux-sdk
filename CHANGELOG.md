# Changelog

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
