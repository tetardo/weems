import type {
  BandMarkReason,
  BandRow,
  FlightBands,
  FlightPhase,
  RecordedPoint,
} from "@weems/contrats";
import { qualityOf, recorded, type Quality } from "./data-quality.ts";

/** A recorded point; the phase is known on the flight page, not on the simplified trajectories. */
export type MarkedPoint = RecordedPoint & { phase?: FlightPhase | null };
type Points = readonly MarkedPoint[];

/** Provisional criteria (docs/suivi/a-voir-avec-houssine.md), to set with a pilot. */
const SPEED_LIMIT_KT = 250; // SERA.6001, below FL100
const SPEED_LIMIT_BELOW_FT = 10_000;
const BANK_LIMIT_DEG = 30;
const SINK_RATE_FPM = -1_000; // FSF stabilised approach, below 1,000 ft above the ground
const SINK_RATE_BELOW_AGL_FT = 1_000;
const LANDING_LIGHT_BELOW_FT = 10_000;
const TAXI_LIMIT_KT = 30;
const TAXI_PHASES: ReadonlySet<FlightPhase> = new Set(["TAXI_OUT", "TAXI_IN"]);
/** Passenger comfort: cabin climbing faster than 500 ft/min, descending faster than 300 ft/min. */
const CABIN_CLIMB_FPM = 500;
const CABIN_DESCENT_FPM = -300;
/** A cabin this far under the aircraft at some point: the aircraft is pressurised. */
const PRESSURISED_MARGIN_FT = 2_000;

const engineRunning = (p: MarkedPoint) =>
  p.engines && p.engines.length > 0 ? p.engines.some((e) => e.running) : undefined;

/**
 * Each mark: the row it is drawn on, the fields it relies on (each must be live, see
 * data-quality.ts) and the test of one point. `applies`: the rule makes sense for this aircraft.
 */
interface Rule {
  reason: BandMarkReason;
  row: BandRow;
  fields: readonly ((p: MarkedPoint) => boolean | number | null | undefined)[];
  /** Alarms: never sounding is the normal case, not a frozen variable. */
  steady?: boolean;
  applies?: (points: Points) => boolean;
  test: (p: MarkedPoint) => boolean;
}

const RULES: readonly Rule[] = [
  {
    reason: "speed250",
    row: "speed",
    fields: [],
    test: (p) => !p.onGround && p.altMsl < SPEED_LIMIT_BELOW_FT && p.ias > SPEED_LIMIT_KT,
  },
  {
    reason: "bank30",
    row: "bank",
    fields: [],
    test: (p) => p.bank !== undefined && Math.abs(p.bank) > BANK_LIMIT_DEG,
  },
  {
    reason: "sinkRate",
    row: "verticalSpeed",
    fields: [],
    test: (p) => !p.onGround && p.altAgl < SINK_RATE_BELOW_AGL_FT && p.vs < SINK_RATE_FPM,
  },
  {
    reason: "overspeedWarning",
    row: "speed",
    fields: [(p) => p.overspeed],
    steady: false,
    test: (p) => !p.onGround && p.overspeed === true,
  },
  {
    reason: "stallWarning",
    row: "speed",
    fields: [(p) => p.stall],
    steady: false,
    test: (p) => !p.onGround && p.stall === true,
  },
  {
    reason: "beaconOff",
    row: "beacon",
    fields: [(p) => p.lights?.beacon, engineRunning],
    test: (p) => engineRunning(p) === true && p.lights?.beacon === false,
  },
  {
    reason: "strobeOffRunway",
    row: "strobe",
    fields: [(p) => p.lights?.strobe, (p) => p.onRunway],
    test: (p) => p.onRunway === true && p.lights?.strobe === false,
  },
  {
    reason: "landingLightLow",
    row: "landingLight",
    fields: [(p) => p.landingLight],
    test: (p) => !p.onGround && p.altMsl < LANDING_LIGHT_BELOW_FT && p.landingLight === false,
  },
  {
    reason: "taxiSpeed",
    row: "speed",
    fields: [],
    test: (p) =>
      p.phase != null &&
      TAXI_PHASES.has(p.phase) &&
      p.onGround &&
      p.onRunway !== true &&
      p.gs > TAXI_LIMIT_KT,
  },
  {
    reason: "cabinRate",
    row: "cabinRate",
    fields: [(p) => p.cabinRate],
    applies: (points) =>
      points.some(
        (p) => !p.onGround && p.cabinAlt != null && p.altMsl - p.cabinAlt > PRESSURISED_MARGIN_FT,
      ),
    test: (p) =>
      p.cabinRate != null && (p.cabinRate > CABIN_CLIMB_FPM || p.cabinRate < CABIN_DESCENT_FPM),
  },
];

/** Quality of a rule: live only when every field it relies on is live on this flight. */
function ruleQuality(rule: Rule, points: Points): Quality {
  const qualities = rule.fields.map((field) => qualityOf(points.map(field), rule.steady));
  if (qualities.includes("absent")) return "absent";
  return qualities.includes("frozen") ? "frozen" : "live";
}

/**
 * The rules checked on this flight, and those that could not be (unmeasured): a field never sent
 * (older tracker) leaves the rule out without a word; a field null or frozen on this aircraft
 * makes it « not measured ». A rule that does not apply (unpressurised cabin) is left out.
 */
export function checkedRules(points: Points): { checked: Rule[]; unmeasured: BandMarkReason[] } {
  const checked: Rule[] = [];
  const unmeasured: BandMarkReason[] = [];
  for (const rule of RULES) {
    const sent = rule.fields.every((field) => recorded(points.map(field)));
    if (!sent || (rule.applies && !rule.applies(points))) continue;
    if (ruleQuality(rule, points) === "live") checked.push(rule);
    else unmeasured.push(rule.reason);
  }
  return { checked, unmeasured };
}

const reasonsOf = (rules: readonly Rule[], p: MarkedPoint) => rules.filter((rule) => rule.test(p));

/** Every reason met at least once along a trajectory (page Statistiques, goals). */
export function markReasons(points: Points): Set<BandMarkReason> {
  const { checked } = checkedRules(points);
  return new Set(points.flatMap((p) => reasonsOf(checked, p)).map((rule) => rule.reason));
}

type Marks = NonNullable<FlightBands["marks"]>;

/**
 * Marks of the bands, from the points of each minute: consecutive minutes with the same reason
 * become one mark. Also the reasons that could not be checked on this flight.
 */
export function marksOf(minutes: readonly Points[]): {
  marks: Marks;
  unmeasured: BandMarkReason[];
} {
  const { checked, unmeasured } = checkedRules(minutes.flat());
  const marks: Marks = [];
  minutes.forEach((points, index) => {
    const rules = new Set(points.flatMap((p) => reasonsOf(checked, p)));
    for (const { reason, row } of rules) {
      const open = marks.findLast((m) => m.reason === reason);
      if (open && open.to === index - 1) open.to = index;
      else marks.push({ row, from: index, to: index, reason });
    }
  });
  return { marks, unmeasured };
}
