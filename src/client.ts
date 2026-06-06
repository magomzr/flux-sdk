import { FlagCache } from "./cache.js";
import type { Flag, FlagMap, FluxConfig } from "./types.js";

interface ResolvedConfig {
  apiKey: string;
  baseUrl: string;
  autoRefresh: number;
  defaults: Record<string, boolean | string | number>;
  onUpdate: ((flags: FlagMap) => void) | undefined;
}

export class FluxClient {
  private readonly config: ResolvedConfig;
  private readonly cache: FlagCache;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private initialized: boolean = false;
  private etag: string | null = null;

  constructor(config: FluxConfig) {
    this.validateConfig(config);

    this.config = {
      autoRefresh: 0,
      defaults: {},
      onUpdate: undefined,
      ...config,
    };

    this.cache = new FlagCache();
  }

  /**
   * Initialize the client — fetches flags once from the server.
   * Must be called before reading any flags.
   * If autoRefresh is configured, starts background refresh after init.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.fetchFlags();
    this.initialized = true;

    // Start auto-refresh if configured (opt-in, disabled by default)
    if (this.config.autoRefresh > 0) {
      this.startAutoRefresh();
    }
  }

  /**
   * Manually refresh flags from the server.
   * Call this when you want the SDK to pick up changes — e.g. on navigation,
   * after login, or when returning from background.
   *
   * Uses ETag for efficiency — if nothing changed, no data is transferred.
   */
  async refresh(): Promise<void> {
    await this.fetchFlags();
  }

  /**
   * Check if a boolean flag is enabled.
   * Returns the default value if the flag hasn't been loaded.
   */
  isEnabled(key: string): boolean {
    this.assertInitialized();

    const flag = this.cache.get(key);
    if (!flag) return (this.getDefault(key) as boolean) ?? false;

    return flag.enabled;
  }

  /**
   * Get the value of a non-boolean flag (string, number, json).
   * Returns null if the flag is disabled or doesn't exist.
   */
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

  /**
   * Get a specific flag by key with all its metadata.
   */
  getFlag(key: string): Flag | null {
    this.assertInitialized();
    return this.cache.get(key);
  }

  /**
   * Get all flags currently in cache.
   */
  getAllFlags(): FlagMap {
    this.assertInitialized();
    return this.cache.getAll();
  }

  /**
   * Returns true if the client has been initialized.
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Stop auto-refresh and clean up resources.
   */
  destroy(): void {
    this.stopAutoRefresh();
    this.initialized = false;
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private async fetchFlags(): Promise<void> {
    try {
      const headers: Record<string, string> = {
        "X-Api-Key": this.config.apiKey,
      };

      if (this.etag) {
        headers["If-None-Match"] = this.etag;
      }

      const res = await fetch(`${this.config.baseUrl}/sdk/flags`, { headers });

      // 304 — nothing changed, keep cache
      if (res.status === 304) return;

      if (!res.ok) {
        console.warn(`[flux] Failed to fetch flags: ${res.status}`);
        return;
      }

      const newEtag = res.headers.get("ETag");
      if (newEtag) this.etag = newEtag;

      const flags: Flag[] = await res.json();
      const map: FlagMap = Object.fromEntries(flags.map((f) => [f.key, f]));
      this.cache.set(map);
      this.config.onUpdate?.(map);
    } catch {
      console.warn("[flux] Network error fetching flags, using cached values.");
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshTimer) return;
    this.refreshTimer = setInterval(
      () => void this.fetchFlags(),
      this.config.autoRefresh,
    );
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
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
        "[flux] Client not initialized. Call initialize() first.",
      );
    }
  }

  private getDefault(key: string): boolean | string | number | undefined {
    return this.config.defaults?.[key];
  }
}
