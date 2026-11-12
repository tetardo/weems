import {
  type IconComponent,
  LearnIcon,
  ProgressIcon,
  RoutesIcon,
  SimpleIcon,
  TrackerIcon,
  UsersIcon,
} from "../ui/icons.ts";

/** Key of a step in the texts Discover.steps. */
export type StepId = "tracker" | "followUp" | "community" | "simplicity" | "training" | "progress";

/** Key of a tag in Discover.tags; `kind` sets its colour. */
export interface StepTag {
  readonly key: "free" | "freeBase" | "soonCompanies" | "proAnalysis" | "proTrends";
  readonly kind: "free" | "soon" | "plan";
}

export interface DiscoverStep {
  readonly id: StepId;
  readonly icon: IconComponent;
  readonly tags: readonly StepTag[];
  /** Shows the « simulation only » notice under the points. */
  readonly simulationNotice?: boolean;
}

const FREE: StepTag = { key: "free", kind: "free" };
const FREE_BASE: StepTag = { key: "freeBase", kind: "free" };

/**
 * The six steps of the page Découvrir, in reading order. The tags must stay true to the plans
 * catalogue (GET /v1/plans): « Pilot Pro » only on what the catalogue keeps for Pilot Pro.
 */
export const DISCOVER_STEPS: readonly DiscoverStep[] = [
  { id: "tracker", icon: TrackerIcon, tags: [FREE] },
  { id: "followUp", icon: RoutesIcon, tags: [FREE] },
  { id: "community", icon: UsersIcon, tags: [FREE, { key: "soonCompanies", kind: "soon" }] },
  { id: "simplicity", icon: SimpleIcon, tags: [FREE] },
  {
    id: "training",
    icon: LearnIcon,
    tags: [FREE_BASE, { key: "proAnalysis", kind: "plan" }],
    simulationNotice: true,
  },
  { id: "progress", icon: ProgressIcon, tags: [FREE_BASE, { key: "proTrends", kind: "plan" }] },
];

/** Points listed under each step (Discover.steps.<id>.point1…3). */
export const STEP_POINTS = ["point1", "point2", "point3"] as const;
