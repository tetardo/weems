import { angleDiffDeg, normalizeDeg } from "../../../src/core/geo.ts";

const G = 9.81;
const MS_PER_KT = 0.514444;
const RAD = Math.PI / 180;
/** Standard rate turn: 360° in two minutes. */
const STANDARD_RATE_DEG_S = 3;
/** Airliners limit bank to about 25° (autopilot); above it the turn rate drops instead. */
const MAX_BANK_DEG = 25;
const GROUND_TURN_DEG_S = 10;

/** Turn rate in °/s: standard rate, or less when that would need more than the maximum bank. */
export function turnRateDegS(gsKt: number, onGround: boolean): number {
  if (onGround) return GROUND_TURN_DEG_S;
  const speed = Math.max(1, gsKt * MS_PER_KT);
  return Math.min(STANDARD_RATE_DEG_S, (G * Math.tan(MAX_BANK_DEG * RAD)) / speed / RAD);
}

/** Radius in NM of a turn at the rate above. */
export function turnRadiusNm(gsKt: number, onGround: boolean): number {
  return gsKt / 3600 / (turnRateDegS(gsKt, onGround) * RAD);
}

/** Bank angle in degrees for a coordinated turn at `rateDegS` (positive = right). */
function bankFor(gsKt: number, rateDegS: number): number {
  return Math.atan((gsKt * MS_PER_KT * rateDegS * RAD) / G) / RAD;
}

/** What steering needs to know about the aircraft. */
interface Motion {
  heading: number;
  gs: number;
  onGround: boolean;
}

/** New heading and bank after `seconds` turning toward `desired`, no faster than the turn rate. */
export function turnToward(
  { heading, gs, onGround }: Motion,
  desired: number,
  seconds: number,
): { heading: number; bank: number } {
  const maxTurn = turnRateDegS(gs, onGround) * seconds;
  const wanted = angleDiffDeg(heading, desired);
  const turn = Math.max(-maxTurn, Math.min(maxTurn, wanted));
  const bank = onGround || seconds === 0 ? 0 : bankFor(gs, turn / seconds);
  return { heading: normalizeDeg(heading + turn), bank };
}
