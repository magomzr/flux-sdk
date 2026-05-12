export interface FluxConfig {
  apiKey: string;
  baseUrl: string;
  pollInterval?: number; // ms, defaults to 30_000
  defaults?: Record<string, boolean | string | number>;
  onUpdate?: (flags: FlagMap) => void; // called after each successful poll with updated flags
}

export interface Flag {
  key: string;
  enabled: boolean;
  value: string | number | boolean | object | null;
  type: "boolean" | "string" | "number" | "json";
}

export type FlagMap = Record<string, Flag>;
