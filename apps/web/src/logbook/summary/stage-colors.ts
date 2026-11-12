import { PHASE_COLORS } from "../../flight/phase-colors.ts";
import type { Stage } from "./phase-profile.ts";

/** Colour of a stage of the Résumé profile: the one of its main phase on the flight page. */
export const STAGE_COLORS: Record<Stage, string> = {
  ground: PHASE_COLORS.TAXI_OUT,
  climb: PHASE_COLORS.CLIMB,
  cruise: PHASE_COLORS.CRUISE,
  descent: PHASE_COLORS.DESCENT,
  approach: PHASE_COLORS.APPROACH,
};
