# @magomzr/flux-sdk

SDK for consuming feature flags from a Flux server.

## Installation

```sh
npm install @magomzr/flux-sdk
```

## Usage

```ts
import { FluxClient } from "@magomzr/flux-sdk";

const client = new FluxClient({
  apiKey: "your-api-key",
  baseUrl: "https://your-flux-server.com",
  defaults: {
    "my-feature": false,
  },
});

await client.initialize();

// Check if a boolean flag is enabled
client.isEnabled("my-feature"); // boolean

// Get a non-boolean flag value
client.getVariant<string>("banner_text"); // string | null

// Get a flag with full metadata
client.getFlag("my-feature"); // Flag | null

// Get all flags
client.getAllFlags(); // FlagMap

// Manually refresh flags (e.g. on navigation, after login)
await client.refresh();

// Clean up when done
client.destroy();
```

## How it works

When `initialize()` is called, the client fetches all flags from the server once and stores them in memory. All subsequent reads (`isEnabled`, `getVariant`, `getFlag`, `getAllFlags`) are instant — they read from the local cache, no network.

To pick up flag changes, call `refresh()` when it makes sense for your app:

- On navigation between pages
- After login / user change
- When returning from background (mobile)
- On a manual "refresh" action

`refresh()` uses ETag-based conditional GET — if nothing changed on the server, no data is transferred (304 Not Modified). This makes it cheap to call frequently.

## Configuration

| Option        | Type       | Required | Default        | Description                                           |
| ------------- | ---------- | -------- | -------------- | ----------------------------------------------------- |
| `apiKey`      | `string`   | ✓        | —              | SDK API key for the environment                       |
| `baseUrl`     | `string`   | ✓        | —              | Base URL of the Flux server                           |
| `defaults`    | `object`   | —        | `{}`           | Fallback values per flag key                          |
| `onUpdate`    | `function` | —        | —              | Called after each successful fetch                    |
| `autoRefresh` | `number`   | —        | `0` (disabled) | Background refresh interval in ms. Set > 0 to enable. |

## Auto-refresh (opt-in)

For cases where you need flags to update without manual calls, enable background auto-refresh:

```ts
const client = new FluxClient({
  apiKey: "flux_production_...",
  baseUrl: "https://your-flux-server.com",
  autoRefresh: 60_000, // refresh every 60s in background
});
```

This is opt-in and disabled by default. For most use cases, manual `refresh()` calls give you more control with less server load.

## Usage with Angular

### 1. Configure in `app.config.ts`

```ts
import {
  ApplicationConfig,
  provideAppInitializer,
  inject,
} from "@angular/core";
import { FluxClient } from "@magomzr/flux-sdk";
import { environment } from "./environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FluxClient,
      useFactory: () =>
        new FluxClient({
          apiKey: environment.fluxApiKey,
          baseUrl: environment.fluxBaseUrl,
        }),
    },
    provideAppInitializer(async () => {
      await inject(FluxClient).initialize();
    }),
  ],
};
```

### 2. Use in components

```ts
import { Component, inject } from "@angular/core";
import { FluxClient } from "@magomzr/flux-sdk";

@Component({
  selector: "app-feature",
  template: `
    @if (showNewUi) {
      <app-new-ui />
    } @else {
      <app-legacy-ui />
    }
  `,
})
export class FeatureComponent {
  private flux = inject(FluxClient);

  showNewUi = this.flux.isEnabled("new_ui");
  title = this.flux.getVariant<string>("app_title") ?? "Default";
}
```

### 3. Refresh on navigation

```ts
import { inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { FluxClient } from "@magomzr/flux-sdk";
import { filter } from "rxjs";

// In app.config.ts or a root component:
const router = inject(Router);
const flux = inject(FluxClient);

router.events
  .pipe(filter((e) => e instanceof NavigationEnd))
  .subscribe(() => flux.refresh());
```

This refreshes flags on every page navigation — cheap (ETag-based), and ensures the user always has the latest config without polling.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
