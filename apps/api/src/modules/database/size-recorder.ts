const HOUR_MS = 3_600_000;

/**
 * Records the size of the database at start, then every hour, so that the charts of the page
 * Base de données have a reading for every day the API ran, console open or not.
 */
export class SizeRecorder {
  private readonly record: () => Promise<void>;
  private readonly onError: (err: unknown) => void;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(record: () => Promise<void>, onError: (err: unknown) => void) {
    this.record = record;
    this.onError = onError;
  }

  start(): void {
    if (this.timer) return;
    this.tick();
    this.timer = setInterval(() => this.tick(), HOUR_MS);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    this.record().catch(this.onError);
  }
}
