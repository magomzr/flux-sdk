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
| `defaults`     | `object` | —        | `{}`     | Fallback values per flag key       |

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
