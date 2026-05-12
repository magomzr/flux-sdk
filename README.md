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
  pollInterval: 30_000, // optional, default 30s. Set to 0 to disable polling.
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

When `initialize()` is called, the client fetches all flags from the server and stores them in memory. If `pollInterval` is greater than 0, a poller starts and refreshes the flags at the configured interval — waiting for each fetch to complete before scheduling the next one. If the server returns a `304 Not Modified`, the cache is kept as-is. If the server fails, the previous cached values are preserved.

Setting `pollInterval: 0` disables polling entirely. Flags are fetched once on initialize and stay fresh for the lifetime of the session.

## Configuration

| Option         | Type       | Required | Default  | Description                                          |
|----------------|------------|----------|----------|------------------------------------------------------|
| `apiKey`       | `string`   | ✓        | —        | Authentication key                                   |
| `baseUrl`      | `string`   | ✓        | —        | Base URL of the Flux server                          |
| `pollInterval` | `number`   | —        | `30000`  | Refresh interval in ms. Set to `0` to disable.      |
| `defaults`     | `object`   | —        | `{}`     | Fallback values per flag key                         |
| `onUpdate`     | `function` | —        | —        | Called after each poll when flags change             |

## Usage with Angular

### 1. Configure providers in `app.config.ts`

```ts
import { ApplicationConfig, provideAppInitializer, inject } from '@angular/core';
import { FluxClient } from '@magomzr/flux-sdk';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: FluxClient,
      useFactory: () => new FluxClient({
        apiKey: environment.fluxApiKey,
        baseUrl: environment.fluxBaseUrl,
        pollInterval: 0, // fetch once on initialize
      }),
    },
    provideAppInitializer(async () => {
      await inject(FluxClient).initialize();
    }),
  ],
};
```

### 2. Use flags in components

```ts
import { Component, inject } from '@angular/core';
import { FluxClient } from '@magomzr/flux-sdk';

@Component({
  selector: 'app-feature',
  template: `
    @if (showNewUi) {
      <app-new-ui />
    } @else {
      <app-legacy-ui />
    }

    <button [style.background]="bannerColor">Click me</button>
  `,
})
export class FeatureComponent {
  private flux = inject(FluxClient);

  showNewUi  = this.flux.isEnabled('new_ui');
  bannerColor = this.flux.getVariant<string>('banner_color') ?? 'blue';
}
```

Flags are read once when the component is constructed. Since `initialize()` runs before the app renders via `provideAppInitializer`, all flags are available immediately — no loading states needed.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
