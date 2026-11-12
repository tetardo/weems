import { TOUCHDOWN_COLORS, touchdownBucket } from "../profile/chart-geometry.ts";

/** A touchdown vertical speed in the colour of its bucket (soft, normal, firm, hard). */
export function TouchdownValue({ vs, className = "" }: { vs: number; className?: string }) {
  return (
    <b
      className={`font-semibold tabular-nums ${className}`}
      style={{ color: TOUCHDOWN_COLORS[touchdownBucket(vs)] }}
    >
      {Math.round(vs)}
    </b>
  );
}
