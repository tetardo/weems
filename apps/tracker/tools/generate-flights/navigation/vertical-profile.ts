/** 3° glide path: about 318 ft per NM. */
const PATH_FT_PER_NM = 318;
/** Feedback toward the path: ft/min of correction per ft of error. */
const PATH_GAIN_PER_MIN = 1;
const MAX_DESCENT_FPM = 3500;
/** Never shallower once descending, so that the descent is not mistaken for a level-off. */
const MIN_DESCENT_FPM = 400;
const FLARE_HEIGHT_FT = 20;
/** Climb gradient used to size the cruise level: 2 500 ft/min at about 400 kt. */
const CLIMB_FT_PER_NM = 375;
/** Level flight planned even on the shortest route, for the CRUISE phase (60 s confirmation). */
const MIN_LEVEL_NM = 15;
/** Level flight kept in any case: CRUISE is confirmed after 60 s. */
const MIN_LEVEL_S = 120;

/**
 * Highest cruise level (ft above sea level, whole thousands) that leaves room to climb,
 * level off and descend on a 3° path over `routeNm`; never above `wantedFt`.
 */
export function cruiseCeilingFt(
  wantedFt: number,
  routeNm: number,
  departureElevationFt: number,
  arrivalElevationFt: number,
): number {
  const climbNmPerFt = 1 / CLIMB_FT_PER_NM;
  const descentNmPerFt = 1 / PATH_FT_PER_NM;
  const room =
    routeNm -
    MIN_LEVEL_NM +
    departureElevationFt * climbNmPerFt +
    arrivalElevationFt * descentNmPerFt;
  const ceiling = Math.floor(room / (climbNmPerFt + descentNmPerFt) / 1000) * 1000;
  return Math.min(wantedFt, ceiling);
}

/** True when climbing higher would leave less than MIN_LEVEL_S of level flight before the path. */
export function mustLevelOff(
  altitudeFt: number,
  remainingNm: number,
  gsKt: number,
  arrivalElevationFt: number,
): boolean {
  const levelNm = remainingNm - pathDistanceNm(altitudeFt, arrivalElevationFt);
  return levelNm <= (gsKt * MIN_LEVEL_S) / 3600;
}

/** Altitude of the 3° path `remainingNm` from the aiming point. */
export function pathAltitudeFt(remainingNm: number, arrivalElevationFt: number): number {
  return arrivalElevationFt + remainingNm * PATH_FT_PER_NM;
}

/** Remaining distance at which a level flight at `altitudeFt` meets the 3° path. */
export function pathDistanceNm(altitudeFt: number, arrivalElevationFt: number): number {
  return Math.max(0, altitudeFt - arrivalElevationFt) / PATH_FT_PER_NM;
}

/**
 * Vertical speed that follows the 3° path: level while below it (waiting to intercept),
 * then down at the speed-dependent path rate, corrected toward the path.
 */
export function pathVs(
  altitudeFt: number,
  pathFt: number,
  gsKt: number,
  currentVs: number,
): number {
  const error = altitudeFt - pathFt;
  const descending = currentVs < -MIN_DESCENT_FPM / 2;
  if (error <= 0 && !descending) return 0;
  const vs = -(gsKt / 60) * PATH_FT_PER_NM - error * PATH_GAIN_PER_MIN;
  return Math.max(-MAX_DESCENT_FPM, Math.min(-MIN_DESCENT_FPM, vs));
}

/** Flare: the sink rate eases from the path rate to `touchdownVs` in the last 20 ft. */
export function flareVs(heightFt: number, pathRateVs: number, touchdownVs: number): number {
  if (heightFt >= FLARE_HEIGHT_FT) return pathRateVs;
  return touchdownVs + (pathRateVs - touchdownVs) * (heightFt / FLARE_HEIGHT_FT);
}

/** Touchdown sink rate drawn from `random`: mostly gentle (median ~ 220 ft/min), rarely firm. */
export function drawTouchdownVs(random: () => number): number {
  return -(60 + 640 * random() ** 2);
}
