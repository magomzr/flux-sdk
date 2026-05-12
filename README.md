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

### 3. Using flags in services and business logic

`isEnabled()`, `getVariant()`, and `getAllFlags()` all read from the in-memory cache synchronously — no additional requests are made. You can inject `FluxClient` anywhere in your app:

```ts
import { Injectable, inject } from '@angular/core';
import { FluxClient } from '@magomzr/flux-sdk';

@Injectable({ providedIn: 'root' })
export class PricingService {
  private flux = inject(FluxClient);

  calculateDiscount(basePrice: number): number {
    if (!this.flux.isEnabled('discount_feature')) return 0;

    const rate = this.flux.getVariant<number>('discount_rate') ?? 0.1;
    return basePrice * rate;
  }
}
```

Or iterate over all flags directly:

```ts
const allFlags = this.flux.getAllFlags();
const activeFlags = Object.values(allFlags).filter(f => f.enabled);
```

This is where polling shines. When `pollInterval` is set, the cache updates in the background automatically. Every time a service method is called, it reads the latest value — no page refresh needed. A discount rate, a feature gate, a pricing rule — all stay current throughout the session without any extra wiring.

For UI rendering, flags are read once when the component is constructed, so polling has no effect on the template. If you need the template to react to flag changes, use the `onUpdate` callback combined with a signal. For everything else — services, calculations, guards, interceptors — polling + direct `inject` is all you need.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
