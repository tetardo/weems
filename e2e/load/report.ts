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
  /** null: not measurable on this run (see memoryDrift). */
  passed: boolean | null;
}

const ms = (value: number) => `${Math.round(value)} ms`;

/** Below this, the API is still warming up at the reference point: drift means nothing. */
const MEMORY_MIN_MINUTES = 20;

/** Spec J4 criterion 6: memory between the 10th minute and the end; null on a shorter run. */
function memoryDrift(readings: readonly MetricsReading[], minutes: number): number | null {
  if (minutes < MEMORY_MIN_MINUTES) return null;
  const first = readings[0];
  const last = readings[readings.length - 1];
  if (!first || !last) return Number.POSITIVE_INFINITY;
  const reference = readings.find((r) => r.atMs >= first.atMs + 10 * 60_000) ?? first;
  return Math.abs(last.memoryMb.rss - reference.memoryMb.rss) / reference.memoryMb.rss;
}

function memoryCriterion(readings: readonly MetricsReading[], minutes: number): Criterion {
  const drift = memoryDrift(readings, minutes);
  const end = `fin ${readings.at(-1)?.memoryMb.rss ?? "?"} Mo`;
  return {
    id: 6,
    label: "Mémoire de l'API stable (écart < 20 %)",
    value:
      drift === null
        ? `non mesurée (mesure de moins de ${MEMORY_MIN_MINUTES} min), ${end}`
        : `écart ${Math.round(drift * 100)} %, ${end}`,
    passed: drift === null ? null : drift < 0.2,
  };
}

function eventLoopShare(readings: readonly MetricsReading[]): number {
  if (readings.length === 0) return 0;
  return readings.filter((r) => r.eventLoopDelayMs.p99 < 100).length / readings.length;
}

/** The seven criteria of the spec, each with its measured value and verdict. */
export function judge(m: LoadMeasures): Criterion[] {
  const delay = m.deliveryDelayMs;
  const share = eventLoopShare(m.apiReadings);
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
    memoryCriterion(m.apiReadings, m.minutes),
    {
      id: 7,
      label: "Mesure valide (boucle du générateur p99 < 200 ms)",
      value: ms(m.generatorLagP99Ms),
      passed: m.generatorLagP99Ms < 200,
    },
  ];
}

const STATUS = new Map([
  [true, "OK    "],
  [false, "ÉCHEC "],
  [null, "—     "],
]);

/** A run succeeds when no criterion failed; a criterion not measurable on it does not count. */
export function isSuccess(criteria: readonly Criterion[]): boolean {
  return criteria.every((c) => c.passed !== false);
}

/** The report as Greg reads it in the terminal (French, one criterion per line). */
export function formatReport(m: LoadMeasures, criteria: readonly Criterion[]): string {
  const header = `${m.pilots} pilotes, ${m.viewers} spectateurs, ×${m.speed}, ${m.minutes} min`;
  const lines = criteria.map((c) => `${STATUS.get(c.passed)} ${c.id}. ${c.label} : ${c.value}`);
  const verdict = isSuccess(criteria) ? "Palier réussi" : "Palier échoué";
  return [header, ...lines, verdict].join("\n");
}
