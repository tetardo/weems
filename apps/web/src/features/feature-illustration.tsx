import type { FeatureKey } from "@weems/contrats";
import type { ReactNode } from "react";
import { ANALYSIS_ILLUSTRATIONS } from "./illustrations/analysis.tsx";
import { COMPANY_ILLUSTRATIONS } from "./illustrations/company.tsx";
import { FLY_ILLUSTRATIONS } from "./illustrations/fly.tsx";
import { IllustrationFrame } from "./illustrations/kit.tsx";
import { LOGBOOK_ILLUSTRATIONS } from "./illustrations/logbook.tsx";

/**
 * One small aviation drawing per function of the catalogue. A Record: a new FeatureKey without
 * its drawing does not compile.
 */
const ILLUSTRATIONS: Record<FeatureKey, ReactNode> = {
  ...FLY_ILLUSTRATIONS,
  ...LOGBOOK_ILLUSTRATIONS,
  ...ANALYSIS_ILLUSTRATIONS,
  ...COMPANY_ILLUSTRATIONS,
};

/** The drawing in front of a function on the page Fonctionnalités. */
export function FeatureIllustration({ feature }: { feature: FeatureKey }) {
  return <IllustrationFrame>{ILLUSTRATIONS[feature]}</IllustrationFrame>;
}
