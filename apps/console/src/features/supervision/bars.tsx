import { barHeights } from "./figures.ts";

/**
 * Vertical bars, one per value, scaled to the tallest. `warn`: the bars to show in orange.
 * `label` describes the chart for a screen reader.
 */
export function Bars(props: { values: number[]; label: string; warn?: boolean[]; tall?: boolean }) {
  const heights = barHeights(props.values);
  return (
    <div
      className={`sv-bars ${props.tall ? "tall" : ""}`}
      role="img"
      aria-label={props.label}
      style={{ gridTemplateColumns: `repeat(${props.values.length}, minmax(0, 1fr))` }}
    >
      {heights.map((height, i) => (
        <i key={i} className={props.warn?.[i] ? "warn" : ""} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

/** Two series stacked per column: `bottom` in the accent colour, `top` in grey. */
export function StackedBars(props: {
  bottom: number[];
  top: number[];
  label: string;
  titles: string[];
}) {
  const totals = props.bottom.map((value, i) => value + (props.top[i] ?? 0));
  const max = Math.max(...totals, 0);
  const pct = (value: number) => (max === 0 ? 0 : (value / max) * 100);
  return (
    <div
      className="sv-bars stacked tall"
      role="img"
      aria-label={props.label}
      style={{ gridTemplateColumns: `repeat(${totals.length}, minmax(0, 1fr))` }}
    >
      {props.bottom.map((value, i) => (
        <span key={i} title={props.titles[i]}>
          <i className="muted" style={{ height: `${pct(props.top[i] ?? 0)}%` }} />
          <i style={{ height: `${pct(value)}%` }} />
        </span>
      ))}
    </div>
  );
}
