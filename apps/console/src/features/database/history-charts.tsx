import type { DatabaseDay } from "@weems/contrats";
import { type ReactNode, useState } from "react";
import { bytes } from "@weems/ui/format";
import {
  flightTotals,
  largestShare,
  monthYear,
  type Projection,
  projection,
  shortDay,
  tableSeries,
} from "./history.ts";
import { growthText } from "./model.ts";

/** Charts at the top of the page Base de données (console spec): the last 30 days. */

const W = 300;
const H = 120;
const PAD = 4;
const fr = (n: number) => n.toLocaleString("fr-FR");

function Card(props: {
  label: string;
  value: string;
  aside: ReactNode;
  caption: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="sv-tile db-chart">
      <div className="sv-tile-head">
        <span className="sv-label">{props.label}</span>
        <span className="muted">30 j</span>
      </div>
      <div className="db-chart-figure">
        <b className="sv-big">{props.value}</b>
        {props.aside}
      </div>
      {props.children}
      <span className="sv-detail db-chart-caption">{props.caption}</span>
    </div>
  );
}

/** One transparent column per day: hovering it shows that day in the caption. */
function HoverZones(props: { count: number; onHover: (index: number | null) => void }) {
  const step = W / props.count;
  return (
    <g onMouseLeave={() => props.onHover(null)}>
      {Array.from({ length: props.count }, (_, i) => (
        <rect
          key={i}
          x={i * step}
          y={0}
          width={step}
          height={H}
          fill="transparent"
          onMouseEnter={() => props.onHover(i)}
        />
      ))}
    </g>
  );
}

function Chart(props: { label: string; children: ReactNode }) {
  return (
    <svg className="db-chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={props.label}>
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} className="db-chart-grid" x1={0} x2={W} y1={H * y} y2={H * y} />
      ))}
      {props.children}
    </svg>
  );
}

/** Columns of stacked values, one per day; nothing on a day without values. */
function StackedColumns(props: {
  days: (number[] | null)[];
  /** Class of each series, bottom first. */
  classes: string[];
  onHover: (i: number | null) => void;
}) {
  const max = Math.max(0, ...props.days.map((day) => (day ?? []).reduce((a, b) => a + b, 0)));
  const step = W / props.days.length;
  const width = step * 0.7;
  return (
    <>
      {props.days.map((day, i) => {
        if (!day || max === 0) return null;
        let top = H;
        return day.map((value, serie) => {
          const height = (value / max) * (H - PAD);
          top -= height;
          return (
            <rect
              key={`${i}-${serie}`}
              className={props.classes[serie]}
              x={i * step + (step - width) / 2}
              y={top}
              width={width}
              height={height}
            />
          );
        });
      })}
      <HoverZones count={props.days.length} onHover={props.onHover} />
    </>
  );
}

/** Runs of consecutive days with a value, as [index, value] pairs. */
function runs(values: (number | null)[]): [number, number][][] {
  const all: [number, number][][] = [];
  let run: [number, number][] = [];
  values.forEach((value, i) => {
    if (value === null) {
      if (run.length) all.push(run);
      run = [];
    } else run.push([i, value]);
  });
  if (run.length) all.push(run);
  return all;
}

/** Solid line over the days with a reading, dashed across the days without one in between. */
function SizeLine(props: { values: (number | null)[]; onHover: (i: number | null) => void }) {
  const known = props.values.filter((value) => value !== null);
  const min = Math.min(...known);
  const max = Math.max(...known);
  const span = max - min || max || 1;
  // Inset by PAD so that the dot of a lone reading on the last day stays whole.
  const x = (i: number) => PAD + (i * (W - 2 * PAD)) / (props.values.length - 1);
  const y = (v: number) => H - PAD - ((v - (min - span * 0.1)) / (span * 1.2)) * (H - 2 * PAD);
  const parts = runs(props.values);
  const points = (run: [number, number][]) => run.map(([i, v]) => `${x(i)},${y(v)}`).join(" ");
  return (
    <>
      {parts.map((run, n) => {
        const [first] = run;
        const last = run.at(-1);
        const next = parts[n + 1]?.[0];
        if (!first || !last) return null;
        return (
          <g key={first[0]}>
            {run.length > 1 && (
              <>
                <polygon
                  className="db-chart-area"
                  points={`${x(first[0])},${H} ${points(run)} ${x(last[0])},${H}`}
                />
                <polyline className="db-chart-line" points={points(run)} />
              </>
            )}
            {run.length === 1 && (
              <circle className="db-chart-dot" cx={x(first[0])} cy={y(first[1])} r={3} />
            )}
            {next && (
              <line
                className="db-chart-line dashed"
                x1={x(last[0])}
                y1={y(last[1])}
                x2={x(next[0])}
                y2={y(next[1])}
              />
            )}
          </g>
        );
      })}
      <HoverZones count={props.values.length} onHover={props.onHover} />
    </>
  );
}

function projectionText(at: Projection): ReactNode {
  if (at.kind === "far")
    return "Au rythme actuel, 20 Go (disque du serveur alpha) dans plus de 5 ans";
  if (at.kind === "none") return "Projection vers 20 Go dès deux relevés en hausse";
  return (
    <>
      Au rythme actuel, 20 Go (disque du serveur alpha) atteints vers <b>{monthYear(at.at)}</b>
    </>
  );
}

function SizeCard({ history, totalBytes }: { history: DatabaseDay[]; totalBytes: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const values = history.map((day) => day.totalBytes);
  const known = values.filter((value) => value !== null);
  const first = known[0];
  const last = known.at(-1);
  const day = hover === null ? null : history[hover];
  return (
    <Card
      label="Taille totale"
      value={bytes(totalBytes)}
      aside={
        first !== undefined &&
        last !== undefined &&
        known.length > 1 && <span className="sv-up">{growthText(last - first)}</span>
      }
      caption={
        day
          ? `${shortDay(day.date)} · ${day.totalBytes === null ? "pas de relevé" : bytes(day.totalBytes)}`
          : projectionText(projection(history))
      }
    >
      <Chart label="Taille totale de la base sur 30 jours">
        {known.length > 0 && <SizeLine values={values} onHover={setHover} />}
      </Chart>
    </Card>
  );
}

function TablesCard({ history }: { history: DatabaseDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const series = tableSeries(history);
  const share = largestShare(series);
  const labels = [...series.names, "autres"];
  const classes = [...series.names.map((_, i) => `db-s${i}`), "db-s3"];
  const day = hover === null ? null : history[hover];
  const sizes = hover === null ? null : series.days[hover];
  return (
    <Card
      label="Répartition par table"
      value={share === null ? "—" : `${Math.round(share * 100)} %`}
      aside={series.names[0] && <span className="muted">dans {series.names[0]}</span>}
      caption={
        day ? (
          `${shortDay(day.date)} · ${
            sizes
              ? sizes.map((size, i) => `${labels[i]} ${bytes(size)}`).join(" · ")
              : "pas de relevé"
          }`
        ) : (
          <span className="db-legend">
            {labels.map((name, i) => (
              <span key={name}>
                <i className={classes[i]} />
                {name}
              </span>
            ))}
          </span>
        )
      }
    >
      <Chart label="Taille des plus grosses tables sur 30 jours">
        <StackedColumns days={series.days} classes={classes} onHover={setHover} />
      </Chart>
    </Card>
  );
}

function FlightsCard({ history }: { history: DatabaseDay[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const totals = flightTotals(history);
  const day = hover === null ? null : history[hover];
  return (
    <Card
      label="Vols enregistrés par jour"
      value={fr(totals.all)}
      aside={<span className="sv-up">dont {fr(totals.real)} réels</span>}
      caption={
        day ? (
          `${shortDay(day.date)} · ${fr(day.realFlights)} réels · ${fr(day.simulatedFlights)} simulés`
        ) : (
          <span className="db-legend">
            <span>
              <i className="db-s0" />
              réels
            </span>
            <span>
              <i className="db-s3" />
              simulés (rejoués, comptes fictifs)
            </span>
          </span>
        )
      }
    >
      <Chart label="Vols ouverts par jour sur 30 jours, réels et simulés">
        <StackedColumns
          days={history.map((d) => [d.realFlights, d.simulatedFlights])}
          classes={["db-s0", "db-s3"]}
          onHover={setHover}
        />
      </Chart>
    </Card>
  );
}

/** Total size, size per table and flights per day, over the last 30 days. */
export function HistoryCharts(props: { history: DatabaseDay[]; totalBytes: number }) {
  return (
    <div className="db-charts">
      <SizeCard history={props.history} totalBytes={props.totalBytes} />
      <TablesCard history={props.history} />
      <FlightsCard history={props.history} />
    </div>
  );
}
