import type {
  FeatureGroup,
  FeatureKey,
  FeatureValue,
  PlanCatalog,
  PlanFeature,
  PlanOffer,
} from "@weems/contrats";

/**
 * The subscription catalogue (cadrage 05, decision 015): the only place that says what each plan
 * includes. Keep it up to date with the site: every new user-visible function gets a row here
 * (key from packages/contrats FeatureKey). Prices are placeholders until payment opens (lot 2).
 */

const PLANS: readonly PlanOffer[] = [
  {
    id: "pilot_free",
    audience: "pilot",
    includes: null,
    recommended: false,
    monthlyCents: 0,
    yearlyCents: 0,
  },
  {
    id: "pilot_pro",
    audience: "pilot",
    includes: "pilot_free",
    recommended: true,
    monthlyCents: 499,
    yearlyCents: 4990,
  },
  {
    id: "company",
    audience: "company",
    includes: "pilot_pro",
    recommended: false,
    monthlyCents: 1900,
    yearlyCents: 19000,
  },
  {
    id: "holding",
    audience: "company",
    includes: "company",
    recommended: false,
    monthlyCents: 5900,
    yearlyCents: 59000,
  },
];

/** Values for Pilot Free, Pilot Pro, Company and Holding, in that order. */
type Row = [
  FeatureKey,
  FeatureGroup,
  onCard: boolean,
  [FeatureValue, FeatureValue, FeatureValue, FeatureValue],
];

const ALL: Row[3] = [true, true, true, true];
const PRO: Row[3] = [false, true, true, true];
const COMPANY: Row[3] = [false, false, true, true];
const HOLDING: Row[3] = [false, false, false, true];

const ROWS: readonly Row[] = [
  ["tracker", "fly", true, ALL],
  ["liveMap", "fly", true, ALL],
  ["publicProfile", "fly", true, ALL],
  ["flightHistory", "fly", true, ALL],
  ["simbriefNextFlight", "fly", false, ALL],
  ["logbookSummary", "logbook", true, ALL],
  ["flightDetail", "logbook", false, ALL],
  ["flightBands", "logbook", false, ALL],
  ["flightNotes", "logbook", false, ALL],
  ["basicStats", "logbook", true, ALL],
  ["statsPeriod", "logbook", true, [12, "unlimited", "unlimited", "unlimited"]],
  ["workOnBasic", "logbook", false, ALL],
  ["goals", "logbook", true, [1, "unlimited", "unlimited", "unlimited"]],
  ["approachAnalysis", "analysis", true, PRO],
  ["workOnDetailed", "analysis", false, PRO],
  ["flightBandsMarks", "analysis", false, PRO],
  ["plannedVsActual", "analysis", true, PRO],
  ["community", "analysis", true, PRO],
  ["compareFlights", "analysis", true, PRO],
  ["sameAircraftComparison", "analysis", false, PRO],
  ["categoryTrends", "analysis", false, PRO],
  ["phaseTime", "analysis", false, PRO],
  ["export", "analysis", true, PRO],
  ["companies", "company", true, [false, false, 1, 5]],
  ["activePilots", "company", true, [false, false, 50, "unlimited"]],
  ["fleetAndRoutes", "company", true, COMPANY],
  ["flightValidation", "company", true, COMPANY],
  ["rankings", "company", true, COMPANY],
  ["sharedManagement", "company", true, HOLDING],
  ["groupStats", "company", true, HOLDING],
];

function feature([key, group, onCard, [free, pro, company, holding]]: Row): PlanFeature {
  return { key, group, onCard, values: { pilot_free: free, pilot_pro: pro, company, holding } };
}

export const PLAN_CATALOG: PlanCatalog = {
  indicativePrices: true,
  currency: "EUR",
  fairUseActivePilots: 1000,
  plans: [...PLANS],
  features: ROWS.map(feature),
};
