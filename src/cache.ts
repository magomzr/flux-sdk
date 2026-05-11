import type { FlagMap } from "./types";

export class FlagCache {
  private store: FlagMap = {};
  private lastUpdated: Date | null = null;

  set(flags: FlagMap): void {
    this.store = flags;
    this.lastUpdated = new Date();
  }

  get(key: string) {
    return this.store[key] ?? null;
  }

  getAll(): FlagMap {
    return this.store;
  }

  isEmpty(): boolean {
    return Object.keys(this.store).length === 0;
  }

  get updatedAt(): Date | null {
    return this.lastUpdated;
  }
}
