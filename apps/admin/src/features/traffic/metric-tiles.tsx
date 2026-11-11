import type { MetricsSample } from "../../server/traffic/traffic-view.ts";
import { sparkPoints } from "./run-progress.ts";

function Tile(props: {
  label: string;
  value: string;
  unit: string;
  values: number[];
  color: string;
}) {
  return (
    <div className="tile">
      <span>{props.label}</span>
      <b>
        {props.value} <small>{props.unit}</small>
      </b>
      <svg className="spark" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points={sparkPoints(props.values)}
          fill="none"
          stroke={props.color}
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

/** Readings of GET /v1/dev/metrics during the run. */
export function MetricTiles({ series, total }: { series: MetricsSample[]; total: number }) {
  const last = series.at(-1);
  const fr = (value: number) => value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return (
    <div className="tiles">
      <Tile
        label="Vols en direct"
        value={String(last?.flights ?? "—")}
        unit={`/ ${total}`}
        values={series.map((s) => s.flights)}
        color="var(--accent)"
      />
      <Tile
        label="Spectateurs"
        value={String(last?.viewers ?? "—")}
        unit=""
        values={series.map((s) => s.viewers)}
        color="var(--success)"
      />
      <Tile
        label="Boucle p99"
        value={last ? fr(last.loopP99Ms) : "—"}
        unit="ms"
        values={series.map((s) => s.loopP99Ms)}
        color="var(--accent2)"
      />
      <Tile
        label="Mémoire API"
        value={last ? fr(last.rssMb) : "—"}
        unit="Mo"
        values={series.map((s) => s.rssMb)}
        color="#b794f6"
      />
    </div>
  );
}
