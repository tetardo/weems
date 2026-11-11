import type { MetricsReading } from "./api-metrics.ts";
import type { Histogram } from "./histogram.ts";

/** Everything measured during one load run. */
export interface LoadMeasures {
  pilots: number;
  viewers: number;
  speed: number;
  minutes: number;
  positionsSent: number;
  positionFailures: number;
  /** Sequence numbers sent but never accepted by the API, all flights together. */
  positionsMissing: number;
  positionResponseMs: Histogram;
  deliveryDelayMs: Histogram;
  /** Positions older than 20 s that a spectator never saw, all spectators together. */
  positionsNeverShown: number;
  apiReadings: readonly MetricsReading[];
  generatorLagP99Ms: number;
}

interface Criterion {
  id: number;
  label: string;
  value: string;
  passed: boolean;
}

const ms = (value: number) => `${Math.round(value)} ms`;

/** Spec J4 criterion 6: memory between the first third of the run (10 min if longer) and the end. */
function memoryDrift(readings: readonly MetricsReading[], minutes: number): number {
  const first = readings[0];
  const last = readings[readings.length - 1];
  if (!first || !last) return Number.POSITIVE_INFINITY;
  const referenceAtMs = first.atMs + Math.min(10, minutes / 3) * 60_000;
  const reference = readings.find((r) => r.atMs >= referenceAtMs) ?? first;
  return Math.abs(last.memoryMb.rss - reference.memoryMb.rss) / reference.memoryMb.rss;
}

function eventLoopShare(readings: readonly MetricsReading[]): number {
  if (readings.length === 0) return 0;
  return readings.filter((r) => r.eventLoopDelayMs.p99 < 100).length / readings.length;
}

/** The seven criteria of the spec, each with its measured value and verdict. */
export function judge(m: LoadMeasures): Criterion[] {
  const delay = m.deliveryDelayMs;
  const share = eventLoopShare(m.apiReadings);
  const drift = memoryDrift(m.apiReadings, m.minutes);
  const worstLoop = Math.max(0, ...m.apiReadings.map((r) => r.eventLoopDelayMs.p99));
  return [
    {
      id: 1,
      label: "Aucune position perdue",
      value: `${m.positionsSent} envoyées, ${m.positionFailures} refusées, ${m.positionsMissing} manquantes`,
      passed: m.positionsSent > 0 && m.positionFailures === 0 && m.positionsMissing === 0,
    },
    {
      id: 2,
      label: "Délai envoi → spectateur (p95 < 3 s, max < 5 s)",
      value: `p50 ${ms(delay.percentile(50))}, p95 ${ms(delay.percentile(95))}, max ${ms(delay.max)} sur ${delay.count}`,
      passed: delay.count > 0 && delay.percentile(95) < 3_000 && delay.max < 5_000,
    },
    {
      id: 3,
      label: "Réponse de l'API aux positions (p95 < 200 ms)",
      value: `p50 ${ms(m.positionResponseMs.percentile(50))}, p95 ${ms(m.positionResponseMs.percentile(95))}, max ${ms(m.positionResponseMs.max)}`,
      passed: m.positionResponseMs.percentile(95) < 200,
    },
    {
      id: 4,
      label: "Aucun avion figé plus de 20 s",
      value: `${m.positionsNeverShown} positions jamais montrées`,
      passed: m.positionsNeverShown === 0,
    },
    {
      id: 5,
      label: "Boucle de l'API (p99 < 100 ms sur 99 % des relevés)",
      value: `${Math.round(share * 100)} % des ${m.apiReadings.length} relevés, pire p99 ${ms(worstLoop)}`,
      passed: m.apiReadings.length > 0 && share >= 0.99,
    },
    {
      id: 6,
      label: "Mémoire de l'API stable (écart < 20 %)",
      value: `écart ${Math.round(drift * 100)} %, fin ${m.apiReadings.at(-1)?.memoryMb.rss ?? "?"} Mo`,
      passed: drift < 0.2,
    },
    {
      id: 7,
      label: "Mesure valide (boucle du générateur p99 < 200 ms)",
      value: ms(m.generatorLagP99Ms),
      passed: m.generatorLagP99Ms < 200,
    },
  ];
}

/** The report as Greg reads it in the terminal (French, one criterion per line). */
export function formatReport(m: LoadMeasures, criteria: readonly Criterion[]): string {
  const header = `${m.pilots} pilotes, ${m.viewers} spectateurs, ×${m.speed}, ${m.minutes} min`;
  const lines = criteria.map(
    (c) => `${c.passed ? "OK    " : "ÉCHEC "} ${c.id}. ${c.label} : ${c.value}`,
  );
  const verdict = criteria.every((c) => c.passed) ? "Palier réussi" : "Palier échoué";
  return [header, ...lines, verdict].join("\n");
}
