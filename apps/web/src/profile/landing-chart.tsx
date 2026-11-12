import type { PilotCharts } from "@weems/contrats";
import { TOUCHDOWN_BUCKETS_FPM } from "@weems/contrats";
import { movingAverage, TOUCHDOWN_COLORS, touchdownBucket } from "./chart-geometry.ts";
import { ChartText } from "./chart-tile.tsx";

const [W, H, L, R, T, B] = [520, 200, 40, 10, 14, 24];

type Landings = PilotCharts["recentLandings"];
interface Texts {
  label: string;
  oldest: string;
  newest: string;
  average: string;
}

/** Position of the n-th landing, and of a vertical speed, against the deepest one drawn. */
interface Scale {
  x: (index: number) => number;
  y: (vs: number) => number;
  max: number;
}

function scaleOf(values: readonly number[]): Scale {
  const max = Math.max(350, ...values.map((v) => -v + 20));
  return {
    x: (i) => L + (i * (W - L - R)) / Math.max(1, values.length - 1),
    y: (vs) => T + (-vs / max) * (H - T - B),
    max,
  };
}

/** Soft and hard zones, and the grid every 100 ft/min. */
function Background({ scale: { y, max } }: { scale: Scale }) {
  const [soft, , firm = 600] = TOUCHDOWN_BUCKETS_FPM;
  const zones = [
    [0, soft, 0],
    [firm, max, 3],
  ] as const;
  return (
    <>
      {zones
        .filter(([from]) => from < max)
        .map(([from, to, color]) => (
          <rect
            key={from}
            x={L}
            y={y(-from)}
            width={W - L - R}
            height={y(-to) - y(-from)}
            fill={TOUCHDOWN_COLORS[color]}
            opacity={0.09}
          />
        ))}
      {[0, 100, 200, 300]
        .filter((g) => g < max)
        .map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(-g)} y2={y(-g)} stroke="var(--color-line)" />
            <ChartText x={L - 6} y={y(-g) + 4} anchor="end">
              {g === 0 ? "0" : `−${g}`}
            </ChartText>
          </g>
        ))}
    </>
  );
}

/** The touchdowns, their moving average (dashed), one dot per landing in its bucket colour. */
function Series({ landings, scale: { x, y } }: { landings: Landings; scale: Scale }) {
  const values = landings.map((l) => l.touchdownVs);
  const line = (series: readonly number[]) => series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  return (
    <>
      <polyline fill="none" stroke="var(--color-accent)" strokeWidth={2.5} points={line(values)} />
      <polyline
        fill="none"
        stroke="var(--color-accent-2)"
        strokeWidth={2}
        strokeDasharray="5 4"
        points={line(movingAverage(values))}
      />
      {landings.map(({ at, touchdownVs }, i) => (
        <circle
          key={at}
          cx={x(i)}
          cy={y(touchdownVs)}
          r={3.5}
          fill={TOUCHDOWN_COLORS[touchdownBucket(touchdownVs)]}
        >
          <title>{`${touchdownVs} ft/min`}</title>
        </circle>
      ))}
    </>
  );
}

function Legend({ texts }: { texts: Texts }) {
  return (
    <>
      <ChartText x={L} y={H - 6} anchor="start">
        {texts.oldest}
      </ChartText>
      <ChartText x={W - R} y={H - 6} anchor="end">
        {texts.newest}
      </ChartText>
      <line
        x1={W - 180}
        x2={W - 162}
        y1={H - 34}
        y2={H - 34}
        stroke="var(--color-accent-2)"
        strokeWidth={2}
        strokeDasharray="5 4"
      />
      <ChartText x={W - 156} y={H - 30} anchor="start">
        {texts.average}
      </ChartText>
    </>
  );
}

/**
 * Touchdown vertical speed of the last flights, oldest on the left, with its moving average over
 * five flights; soft and hard zones in the background.
 */
export function LandingChart({ landings, texts }: { landings: Landings; texts: Texts }) {
  const scale = scaleOf(landings.map((l) => l.touchdownVs));
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={texts.label}
      className="mt-2 block h-auto w-full"
    >
      <Background scale={scale} />
      <Series landings={landings} scale={scale} />
      <Legend texts={texts} />
    </svg>
  );
}
