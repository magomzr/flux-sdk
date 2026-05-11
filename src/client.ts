import { FlagCache } from "./cache.js";
import { Poller } from "./poller.js";
import type { Flag, FlagMap, FluxConfig } from "./types.js";

export class FluxClient {
  private readonly config: Required<FluxConfig>;
  private readonly cache: FlagCache;
  private readonly poller: Poller;
  private initialized: boolean = false;

  constructor(config: FluxConfig) {
    this.validateConfig(config);

    this.config = {
      pollInterval: 30_000,
      defaults: {},
      ...config,
    };

    this.cache = new FlagCache();
    this.poller = new Poller();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.fetchFlags();
    this.poller.start(() => this.fetchFlags(), this.config.pollInterval);
    this.initialized = true;
  }

  isEnabled(key: string): boolean {
    this.assertInitialized();

    const flag = this.cache.get(key);
    if (!flag) return (this.getDefault(key) as boolean) ?? false;

    return flag.enabled;
  }

  getVariant<T extends string | number | object = string>(
    key: string,
  ): T | null {
    this.assertInitialized();

    const flag = this.cache.get(key);
    if (!flag?.enabled) return null;

    if (flag.type === "json" && typeof flag.value === "string") {
      try {
        return JSON.parse(flag.value) as T;
      } catch {
        return null;
      }
    }

    return flag.value as T;
  }

  getAllFlags(): FlagMap {
    this.assertInitialized();
    return this.cache.getAll();
  }

  destroy(): void {
    this.poller.stop();
    this.initialized = false;
  }

  private async fetchFlags() {
    try {
      const res = await fetch(`${this.config.baseUrl}/sdk/flags`, {
        headers: {
          "X-Api-Key": this.config.apiKey,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.warn(`[flux] Failed to fetch flags: ${res.status}`);
        return; // conserva el cache anterior si falla
      }

      const flags: Flag[] = await res.json();
      const map: FlagMap = Object.fromEntries(flags.map((f) => [f.key, f]));
      this.cache.set(map);
    } catch (err) {
      console.warn(
        "[flux] network error fetching flags, using cached values. Error",
      );
      console.warn(err);
    }
  }

  private validateConfig(config: FluxConfig): void {
    if (!config.apiKey || typeof config.apiKey !== "string") {
      throw new Error("[flux] apiKey is required and must be a string");
    }
    if (!config.baseUrl || typeof config.baseUrl !== "string") {
      throw new Error("[flux] baseUrl is required and must be a string");
    }
    try {
      new URL(config.baseUrl);
    } catch {
      throw new Error(`[flux] baseUrl "${config.baseUrl}" is not a valid URL`);
    }
  }

  private assertInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        "[flux] client not initialized. Call initialize() first.",
      );
    }
  }

  private getDefault(key: string): boolean | string | number | undefined {
    return this.config.defaults?.[key];
  }
}
