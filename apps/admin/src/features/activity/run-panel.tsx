"use client";

import type { LiveActivityProgress, PopulationProgress, PopulationResult } from "@weems/contrats";
import type { ActivityRun, LiveResult } from "../../server/activity/activity-view.ts";
import { elapsed } from "../../format/time.ts";
import { InfoIcon } from "../../ui/icons.ts";
import { RunHeader } from "../../ui/run-header.tsx";
import { PopulationChecks, PopulationSteps } from "./population-run.tsx";

function Tile(props: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="tile">
      <span>{props.label}</span>
      <b>
        {props.value} {props.unit && <small>{props.unit}</small>}
      </b>
    </div>
  );
}

/** The four tiles of the live activity: readings while it runs, the tally once it has ended. */
function liveTiles(progress: LiveActivityProgress | null, result: LiveResult | null) {
  const p = progress ?? {
    airborne: 0,
    departed: 0,
    visitors: { done: 0, total: 0 },
    elapsedS: 0,
    durationS: 0,
  };
  const visitors = {
    label: "Visiteurs connectés",
    value: p.visitors.done,
    unit: `/ ${p.visitors.total}`,
  };
  if (result) {
    return [
      { label: "Départs", value: result.departed },
      { label: "Atterris", value: result.landed },
      { label: "Interrompus à la fin", value: result.interrupted },
      visitors,
    ];
  }
  return [
    { label: "En l'air", value: p.airborne, unit: "vols" },
    { label: "Départs", value: p.departed },
    visitors,
    { label: "Temps restant", value: elapsed(Math.max(0, p.durationS - p.elapsedS) * 1000) },
  ];
}

function LiveBody(props: { progress: LiveActivityProgress | null; result: LiveResult | null }) {
  const { progress } = props;
  const share = progress ? Math.min(1, progress.elapsedS / Math.max(1, progress.durationS)) : 0;
  return (
    <>
      <div className="prog">
        <i style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
      <div className="tiles">
        {liveTiles(progress, props.result).map((tile) => (
          <Tile key={tile.label} {...tile} />
        ))}
      </div>
    </>
  );
}

/** The current (or last) run of the page: steps or live readings, then the result. */
export function ActivityRunPanel(props: { run: ActivityRun; busy: boolean; onStop: () => void }) {
  const { run } = props;
  const ended = run.state === "ended";
  return (
    <section className={`panel run ${run.outcome === "success" ? "result-ok" : ""}`}>
      <RunHeader run={run} title={run.summary} busy={props.busy} onStop={props.onStop} />
      {run.launch.kind === "population" ? (
        ended && run.result ? (
          <PopulationChecks result={run.result as PopulationResult} />
        ) : (
          <PopulationSteps progress={run.progress as PopulationProgress | null} />
        )
      ) : (
        <LiveBody
          progress={run.progress as LiveActivityProgress | null}
          result={run.result as LiveResult | null}
        />
      )}
      {run.lastLines.length > 0 && <pre className="term short">{run.lastLines.join("\n")}</pre>}
      {!ended && (
        <p className="note">
          <InfoIcon size={14} />
          {run.launch.kind === "population"
            ? "Arrêter garde ce qui est déjà créé ; « Tout supprimer » l'efface."
            : "Arrêter clôt les vols en l'air comme « interrompus » : ils quittent la carte."}
        </p>
      )}
    </section>
  );
}
