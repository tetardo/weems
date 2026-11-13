"use client";

import type { MetricsSample, RunView } from "../../server/traffic/traffic-view.ts";
import { InfoIcon } from "../../ui/icons.ts";
import { RunHeader } from "../../ui/run-header.tsx";
import { MetricTiles } from "./metric-tiles.tsx";
import { PilotsTable } from "./pilots-table.tsx";
import { runProgress } from "./run-progress.ts";

function title(run: RunView): string {
  if (run.launch.kind === "simulate")
    return `${run.launch.count} pilotes simulés · ×${run.launch.speed}`;
  return `Test de charge · ${run.launch.pilots} pilotes`;
}

/** The current (or last) run: progress, API readings, pilots, and the stop button. */
export function RunPanel(props: {
  run: RunView;
  series: MetricsSample[];
  busy: boolean;
  onStop: () => void;
}) {
  const { run } = props;
  const live = run.state !== "ended";
  const total = run.launch.kind === "simulate" ? run.launch.count : run.launch.pilots;
  return (
    <section className="panel run">
      <RunHeader
        run={run}
        title={title(run)}
        detail={run.detail}
        busy={props.busy}
        onStop={props.onStop}
      />
      <div className="prog">
        <i style={{ width: `${Math.round(runProgress(run, Date.now()) * 100)}%` }} />
      </div>
      {live && <MetricTiles series={props.series} total={total} />}
      {live && run.progress && <PilotsTable pilots={run.progress.pilots} />}
      {!live && run.lastLines.length > 0 && (
        <pre className="term short">{run.lastLines.join("\n")}</pre>
      )}
      {live && run.launch.kind === "simulate" && (
        <p className="note">
          <InfoIcon size={14} /> Arrêter clôt les vols en cours comme « interrompus » : ils quittent
          la carte en direct.
        </p>
      )}
    </section>
  );
}
