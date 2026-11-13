/** Steepest nose angle drawn, degrees: the bar shows a trend, not the real pitch. */
const MAX_PITCH = 20;
/** Vertical speed giving one degree of nose angle, ft/min. */
const FPM_PER_DEGREE = 100;

/**
 * Nose angle of the aircraft drawn on the progress bar (Greg, 13/11/2026): up while climbing,
 * level in cruise, down while descending, from the vertical speed in ft/min.
 */
export function pitchOf(vs: number): number {
  const pitch = Math.round(vs / FPM_PER_DEGREE);
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch)) || 0;
}
