import type { GoalDefinition, GoalKind, GoalSuggestion } from "@weems/contrats";
import type { FlightFact } from "./facts.ts";

const DAY_MS = 86_400_000;
const MAX_SUGGESTIONS = 4;
/** Below this many flights, there is nothing to start from. */
const MIN_FLIGHTS = 3;

const base = {
  threshold: null,
  practice: null,
  aircraft: null,
  until: null,
} satisfies Partial<GoalDefinition>;
const monthly = (definition: Partial<GoalDefinition>): GoalDefinition => ({
  kind: "hours",
  target: 1,
  ...base,
  window: "month",
  recurring: true,
  ...definition,
});

const median = (values: readonly number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

function hours(recent: readonly FlightFact[]): GoalSuggestion {
  const perMonth = recent.reduce((total, f) => total + f.hours, 0) / 3;
  return {
    definition: monthly({ target: Math.max(2, Math.ceil(perMonth * 1.2)) }),
    basis: perMonth,
  };
}

function softLandings(facts: readonly FlightFact[]): GoalSuggestion | null {
  const rates = facts.flatMap((f) => (f.touchdownVs === null ? [] : [Math.abs(f.touchdownVs)]));
  if (rates.length < MIN_FLIGHTS) return null;
  const typical = median(rates.slice(-30));
  const threshold = Math.max(60, Math.floor(typical / 10) * 10 - 10);
  const definition = monthly({ kind: "softLandings", target: 5, threshold, recurring: false });
  return { definition, basis: -typical };
}

function regularity(facts: readonly FlightFact[], now: number): GoalSuggestion {
  const since = now - 56 * DAY_MS;
  const days = new Set(facts.filter((f) => f.at >= since).map((f) => Math.floor(f.at / DAY_MS)));
  const perWeek = days.size / 8;
  const target = Math.min(7, Math.max(1, Math.ceil(perWeek + 0.5)));
  return { definition: monthly({ kind: "regularity", target, recurring: false }), basis: perWeek };
}

function airports(facts: readonly FlightFact[]): GoalSuggestion {
  const seen = new Set(facts.flatMap((f) => [f.departureIcao, f.arrivalIcao]).filter(Boolean));
  return {
    definition: monthly({ kind: "airports", target: 3, recurring: false }),
    basis: seen.size,
  };
}

/**
 * Goals Weems proposes from the pilot's flights (Pilot Pro, key goalSuggestions): a little more
 * than today's figure, one per kind the pilot does not already pursue.
 */
export function goalSuggestions(
  facts: readonly FlightFact[],
  pursued: ReadonlySet<GoalKind>,
  now: Date,
): GoalSuggestion[] {
  if (facts.length < MIN_FLIGHTS) return [];
  const recent = facts.filter((f) => f.at >= now.getTime() - 90 * DAY_MS);
  const all = [
    hours(recent),
    softLandings(facts),
    regularity(facts, now.getTime()),
    airports(facts),
  ];
  return all
    .filter((s): s is GoalSuggestion => s !== null && !pursued.has(s.definition.kind))
    .slice(0, MAX_SUGGESTIONS);
}
