export class Poller {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running: boolean = false;

  start(fn: () => Promise<void>, intervalMs: number): void {
    if (this.running) return;
    this.running = true;
    this.schedule(fn, intervalMs);
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(fn: () => Promise<void>, intervalMs: number): void {
    this.timer = setTimeout(async () => {
      if (!this.running) return;
      await fn();
      if (this.running) this.schedule(fn, intervalMs);
    }, intervalMs);
  }
}
