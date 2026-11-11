/** Wall clock, injected so that tests and replays control time. */
export interface Clock {
  /** Current UTC time in milliseconds since 1970. */
  nowUtcMs(): number;
}
