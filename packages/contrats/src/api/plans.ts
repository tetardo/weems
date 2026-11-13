import { z } from "zod";

/**
 * Subscription plans (cadrage 05, decision 015). The API owns the catalogue: which feature each
 * plan includes, its limits and its prices. Clients only display it (page Offres of the site) and,
 * later, check a feature key, never a plan name.
 */
export const PlanId = z.enum(["pilot_free", "pilot_pro", "company", "holding"]);
export type PlanId = z.infer<typeof PlanId>;

/** Who pays: a pilot for themselves, or a virtual airline (cadrage 05, two axes). */
export const PlanAudience = z.enum(["pilot", "company"]);
export type PlanAudience = z.infer<typeof PlanAudience>;

/** Rows of the comparison table, in display order. */
export const FeatureGroup = z.enum(["fly", "logbook", "analysis", "company"]);
export type FeatureGroup = z.infer<typeof FeatureGroup>;

/**
 * Every function a plan can include: the single list shared by the API, the site and the
 * apps. A new user-visible function of the site adds its key here, then its row in the API
 * catalogue (apps/api/src/modules/plans/catalog.ts) and its labels on the site.
 */
export const FeatureKey = z.enum([
  // Voler et suivre
  "tracker",
  "liveMap",
  "publicProfile",
  "flightHistory",
  "simbriefNextFlight",
  // Carnet de vol
  "logbookSummary",
  "flightDetail",
  "flightBands",
  "flightNotes",
  "basicStats",
  "statsPeriod",
  "workOnBasic",
  "goals",
  "goalSuggestions",
  "goalGoodPractices",
  // Analyse
  "approachAnalysis",
  "workOnDetailed",
  "flightBandsMarks",
  "plannedVsActual",
  "community",
  "compareFlights",
  "sameAircraftComparison",
  "categoryTrends",
  "phaseTime",
  "goodPractices",
  "export",
  // Compagnie
  "companies",
  "activePilots",
  "fleetAndRoutes",
  "flightValidation",
  "rankings",
  "sharedManagement",
  "groupStats",
]);
export type FeatureKey = z.infer<typeof FeatureKey>;

/**
 * Whether pilots can use the function today. The catalogue describes the offer aimed at, so many
 * functions are announced before they exist: the page Fonctionnalités marks them « Bientôt ».
 */
export const FeatureAvailability = z.enum(["available", "soon"]);
export type FeatureAvailability = z.infer<typeof FeatureAvailability>;

/** false: not included; true: included; a number: the limit; "unlimited": no limit. */
export const FeatureValue = z.union([
  z.boolean(),
  z.number().int().positive(),
  z.literal("unlimited"),
]);
export type FeatureValue = z.infer<typeof FeatureValue>;

const Cents = z.number().int().nonnegative();

export const PlanOffer = z.object({
  id: PlanId,
  audience: PlanAudience,
  /** The plan this one contains entirely (Pilot Pro contains Pilot Free…); null for the first. */
  includes: PlanId.nullable(),
  /** Put forward on the page. */
  recommended: z.boolean(),
  monthlyCents: Cents,
  yearlyCents: Cents,
});
export type PlanOffer = z.infer<typeof PlanOffer>;

export const PlanFeature = z.object({
  key: FeatureKey,
  group: FeatureGroup,
  /** Listed on the plan cards (the table shows every feature). */
  onCard: z.boolean(),
  availability: FeatureAvailability,
  values: z.record(PlanId, FeatureValue),
});
export type PlanFeature = z.infer<typeof PlanFeature>;

/** GET /v1/plans: public, no account. */
export const PlanCatalog = z.object({
  /** True while the prices are placeholders (no payment yet). */
  indicativePrices: z.boolean(),
  currency: z.literal("EUR"),
  /** "unlimited" active pilots means up to this many per airline (fair use). */
  fairUseActivePilots: z.number().int().positive(),
  plans: z.array(PlanOffer),
  features: z.array(PlanFeature),
});
export type PlanCatalog = z.infer<typeof PlanCatalog>;

/**
 * GET /v1/me/plan: the plan of the pilot calling. testSwitch: the Free/Pro test switch of the
 * site bar is offered (outside production only, removed before the 1.0).
 */
export const MyPlan = z.object({ plan: PlanId, testSwitch: z.boolean() });
export type MyPlan = z.infer<typeof MyPlan>;

/** PUT /v1/dev/me/plan: plan chosen with the test switch. */
export const TestPlanChange = z.object({ plan: PlanId });
export type TestPlanChange = z.infer<typeof TestPlanChange>;
