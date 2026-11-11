"use client";

import { clock, elapsed } from "../../format/time.ts";
import type { HistoryEntry } from "../../server/traffic/history.ts";
import type { MetricsSample, RunView } from "../../server/traffic/traffic-view.ts";
import { InfoIcon, StopIcon } from "../../ui/icons.ts";
import { StatusBadge, type Tone } from "../../ui/status-badge.tsx";
import { MetricTiles } from "./metric-tiles.tsx";
import { PilotsTable } from "./pilots-table.tsx";
import { runProgress } from "./run-progress.ts";

export const OUTCOMES: Record<HistoryEntry["outcome"], { tone: Tone; label: string }> = {
  success: { tone: "ok", label: "Réussi" },
  failed: { tone: "err", label: "Raté" },
  stopped: { tone: "off", label: "Arrêté" },
};

function RunState({ run }: { run: RunView }) {
  if (run.state === "running")
    return (
      <StatusBadge tone="live" dot>
        En cours
      </StatusBadge>
    );
  if (run.state === "stopping")
    return (
      <StatusBadge tone="warn" dot>
        Arrêt…
      </StatusBadge>
    );
  const outcome = OUTCOMES[run.outcome ?? "stopped"];
  return (
    <StatusBadge tone={outcome.tone}>
      {run.detail ? `${outcome.label} · ${run.detail}` : outcome.label}
    </StatusBadge>
  );
}

function title(run: RunView): string {
  if (run.launch.kind === "simulate")
    return `${run.launch.count} pilotes simulés · ×${run.launch.speed}`;
  return `Test de charge · ${run.launch.pilots} pilotes`;
}

function RunHeader(props: { run: RunView; busy: boolean; onStop: () => void }) {
  const { run } = props;
  const end = run.endedAt ? Date.parse(run.endedAt) : Date.now();
  return (
    <div className="hd">
      <RunState run={run} />
      <h2>{title(run)}</h2>
      <span className="muted hide">
        lancé à {clock(run.startedAt)} · {elapsed(end - Date.parse(run.startedAt))}
      </span>
      {run.state === "running" && (
        <button className="btn sm danger sp" disabled={props.busy} onClick={props.onStop}>
          <StopIcon size={15} /> Arrêter
        </button>
      )}
    </div>
  );
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
      <RunHeader run={run} busy={props.busy} onStop={props.onStop} />
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
