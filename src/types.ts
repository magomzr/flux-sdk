export interface FluxConfig {
  /** SDK API key — required */
  apiKey: string;
  /** Base URL of the Flux server — required */
  baseUrl: string;
  /** Optional fallback values for flags that haven't been loaded yet */
  defaults?: Record<string, boolean | string | number>;
  /** Called after each successful fetch with the updated flags */
  onUpdate?: (flags: FlagMap) => void;
  /**
   * Auto-refresh interval in ms. Disabled by default (0).
   * When set > 0, the SDK will refetch flags in background at this interval.
   * For most use cases, manual refresh() calls are preferred.
   */
  autoRefresh?: number;
}

export interface Flag {
  key: string;
  enabled: boolean;
  value: string | number | boolean | object | null;
  type: "boolean" | "string" | "number" | "json";
}

export type FlagMap = Record<string, Flag>;
