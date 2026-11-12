import type {
  FeatureAvailability,
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
  FeatureAvailability,
];

const ALL: Row[3] = [true, true, true, true];
const PRO: Row[3] = [false, true, true, true];
const COMPANY: Row[3] = [false, false, true, true];
const HOLDING: Row[3] = [false, false, false, true];
/** Built and usable today; "soon" = announced (page Fonctionnalités shows « Bientôt »). */
const NOW: Row[4] = "available";
const SOON: Row[4] = "soon";

const ROWS: readonly Row[] = [
  ["tracker", "fly", true, ALL, NOW],
  ["liveMap", "fly", true, ALL, NOW],
  ["publicProfile", "fly", true, ALL, NOW],
  ["flightHistory", "fly", true, ALL, NOW],
  ["simbriefNextFlight", "fly", false, ALL, SOON],
  ["logbookSummary", "logbook", true, ALL, NOW],
  ["flightDetail", "logbook", false, ALL, NOW],
  ["flightBands", "logbook", false, ALL, SOON],
  ["flightNotes", "logbook", false, ALL, SOON],
  ["basicStats", "logbook", true, ALL, NOW],
  ["statsPeriod", "logbook", true, [12, "unlimited", "unlimited", "unlimited"], SOON],
  ["workOnBasic", "logbook", false, ALL, NOW],
  ["goals", "logbook", true, [1, "unlimited", "unlimited", "unlimited"], SOON],
  ["approachAnalysis", "analysis", true, PRO, SOON],
  ["workOnDetailed", "analysis", false, PRO, SOON],
  ["flightBandsMarks", "analysis", false, PRO, SOON],
  ["plannedVsActual", "analysis", true, PRO, SOON],
  ["community", "analysis", true, PRO, SOON],
  ["compareFlights", "analysis", true, PRO, SOON],
  ["sameAircraftComparison", "analysis", false, PRO, SOON],
  ["categoryTrends", "analysis", false, PRO, SOON],
  ["phaseTime", "analysis", false, PRO, SOON],
  ["goodPractices", "analysis", true, PRO, SOON],
  ["export", "analysis", true, PRO, SOON],
  ["companies", "company", true, [false, false, 1, 5], SOON],
  ["activePilots", "company", true, [false, false, 50, "unlimited"], SOON],
  ["fleetAndRoutes", "company", true, COMPANY, SOON],
  ["flightValidation", "company", true, COMPANY, SOON],
  ["rankings", "company", true, COMPANY, SOON],
  ["sharedManagement", "company", true, HOLDING, SOON],
  ["groupStats", "company", true, HOLDING, SOON],
];

function feature([
  key,
  group,
  onCard,
  [free, pro, company, holding],
  availability,
]: Row): PlanFeature {
  return {
    key,
    group,
    onCard,
    availability,
    values: { pilot_free: free, pilot_pro: pro, company, holding },
  };
}

export const PLAN_CATALOG: PlanCatalog = {
  indicativePrices: true,
  currency: "EUR",
  fairUseActivePilots: 1000,
  plans: [...PLANS],
  features: ROWS.map(feature),
};
