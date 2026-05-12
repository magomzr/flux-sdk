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
  pollInterval: 30_000, // optional, default 30s
  defaults: {           // optional, fallback values
    "my-feature": false,
  },
});

await client.initialize();

// Check if a flag is enabled
client.isEnabled("my-feature"); // boolean

// Get a variant flag value
client.getVariant<string>("button-color"); // string | null

// Get all flags
client.getAllFlags(); // FlagMap

// Stop polling when shutting down
client.destroy();
```

## How it works

When `initialize()` is called, the client does an initial fetch of all flags and starts a poller that refreshes them at the configured interval. Flags are stored in memory. If the server fails, the previous cached values are kept.

## Configuration

| Option         | Type     | Required | Default  | Description                        |
|----------------|----------|----------|----------|------------------------------------|
| `apiKey`       | `string` | ✓        | —        | Authentication key                 |
| `baseUrl`      | `string` | ✓        | —        | Base URL of the Flux server        |
| `pollInterval` | `number` | —        | `30000`  | Refresh interval in ms             |
| `onUpdate`     | `function` | —       | —        | Called after each poll when flags change |

## Usage with Angular

### 1. Configure providers in `app.config.ts`

```ts
import { ApplicationConfig, APP_INITIALIZER, signal } from '@angular/core';
import { FluxClient, FlagMap } from '@magomzr/flux-sdk';
import { environment } from './environments/environment';

// Global signal — holds the latest flag state
export const flags = signal<FlagMap>({});

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FluxClient,
      useFactory: () => new FluxClient({
        apiKey: environment.fluxApiKey,
        baseUrl: environment.fluxBaseUrl,
        pollInterval: 30_000,
        onUpdate: (updated) => flags.set(updated),
      }),
    },
    {
      provide: APP_INITIALIZER,
      useFactory: (flux: FluxClient) => async () => {
        await flux.initialize();
        flags.set(flux.getAllFlags());
      },
      deps: [FluxClient],
      multi: true,
    },
  ],
};
```

### 2. Use flags in components

```ts
import { Component, computed } from '@angular/core';
import { flags } from './app.config';

@Component({
  selector: 'app-feature',
  template: `
    @if (showNewUi()) {
      <app-new-ui />
    } @else {
      <app-legacy-ui />
    }

    <button [style.background]="bannerColor()">Click me</button>
  `,
})
export class FeatureComponent {
  showNewUi  = computed(() => flags()['new_ui']?.enabled ?? false);
  bannerColor = computed(() => flags()['banner_color']?.value as string ?? 'blue');
}
```

`flags` is a global signal updated automatically after each poll. Any `computed` that reads it will re-render when flags change — no wrapper service needed.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
