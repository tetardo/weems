import { type ChartBox, barsOf } from "./chart-geometry.ts";
import { ChartText } from "./chart-tile.tsx";

/**
 * Bars with their value above and their label below. `colors`: one per bar (theme variables);
 * the accent otherwise. `label`: text of the chart for screen readers.
 */
export function BarChart({
  values,
  labels,
  shown = values.map(String),
  colors,
  box = { width: 520, height: 200, top: 20, bottom: 24 },
  label,
}: {
  values: readonly number[];
  labels: readonly string[];
  shown?: readonly string[];
  colors?: readonly string[];
  box?: ChartBox;
  label: string;
}) {
  const bars = barsOf(values, box);
  return (
    <svg
      viewBox={`0 0 ${box.width} ${box.height}`}
      role="img"
      aria-label={label}
      className="mt-2 block h-auto w-full"
    >
      {bars.map((bar, i) => (
        <g key={`${i}-${labels[i]}`}>
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx={4}
            fill={colors?.[i] ?? "var(--color-accent)"}
          />
          <ChartText x={bar.middle} y={bar.y - 5}>
            {shown[i]}
          </ChartText>
          <ChartText x={bar.middle} y={box.height - 6}>
            {labels[i]}
          </ChartText>
        </g>
      ))}
    </svg>
  );
}
