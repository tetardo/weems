import { DevMetrics } from "@weems/contrats";

export interface MetricsReading extends DevMetrics {
  atMs: number;
}

/** Reads GET /v1/dev/metrics every `everyMs` while the load runs (criteria 5 and 6). */
export function pollApiMetrics(baseUrl: string, everyMs = 5_000) {
  const readings: MetricsReading[] = [];
  const read = async () => {
    try {
      const response = await fetch(new URL("/v1/dev/metrics", baseUrl));
      readings.push({ ...DevMetrics.parse(await response.json()), atMs: Date.now() });
    } catch {
      // A reading lost while the API is saturated is itself visible in the report.
    }
  };
  const timer = setInterval(() => void read(), everyMs);
  return {
    readings,
    stop: async () => {
      clearInterval(timer);
      await read();
    },
  };
}
