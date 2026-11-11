import type { PilotCharts } from "@weems/contrats";
import { useFormatter } from "next-intl";
import { cellOpacity } from "./chart-geometry.ts";
import { ChartText } from "./chart-tile.tsx";

const WIDTH = 520;
const LEFT = 50;
const ROW = 22;
const CELL = (WIDTH - LEFT) / 24;
/** Monday 5 January 2026: the weekdays from Monday, named in the language of the page. */
const MONDAY = Date.UTC(2026, 0, 5);

/** Takeoffs by weekday and local hour: a grid of 7 × 24 cells, darker with more takeoffs. */
export function TakeoffChart({
  takeoffs,
  label,
}: {
  takeoffs: PilotCharts["takeoffs"];
  label: string;
}) {
  const format = useFormatter();
  const max = Math.max(...takeoffs.flat());
  const day = (i: number) =>
    format.dateTime(new Date(MONDAY + i * 86_400_000), { weekday: "short", timeZone: "UTC" });
  return (
    <svg
      viewBox={`0 0 ${WIDTH} 200`}
      role="img"
      aria-label={label}
      className="mt-2 block h-auto w-full"
    >
      {takeoffs.map((hours, d) => (
        <g key={d}>
          <ChartText x={LEFT - 10} y={8 + d * ROW + 15} anchor="end">
            {day(d)}
          </ChartText>
          {hours.map((count, h) => (
            <rect
              key={h}
              x={LEFT + h * CELL}
              y={8 + d * ROW}
              width={CELL - 2}
              height={ROW - 3}
              rx={3}
              fill="var(--color-accent)"
              opacity={cellOpacity(count, max)}
            >
              <title>{`${day(d)} ${h} h : ${count}`}</title>
            </rect>
          ))}
        </g>
      ))}
      {[0, 6, 12, 18].map((h) => (
        <ChartText key={h} x={LEFT + h * CELL + CELL / 2} y={196}>
          {`${h} h`}
        </ChartText>
      ))}
      <ChartText x={WIDTH - 2} y={196} anchor="end">
        23 h
      </ChartText>
    </svg>
  );
}
