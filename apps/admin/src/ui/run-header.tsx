import { clock, elapsed } from "../format/time.ts";
import { StopIcon } from "./icons.ts";
import { type RunOutcome, RunState } from "./run-state.tsx";

/** Header of a run (pages Trafic simulé and Activité simulée): state, title, times, Stop. */
export function RunHeader(props: {
  run: {
    state: "running" | "stopping" | "ended";
    outcome: RunOutcome | null;
    startedAt: string;
    endedAt: string | null;
  };
  title: string;
  detail?: string | null | undefined;
  busy: boolean;
  onStop: () => void;
}) {
  const { run } = props;
  const end = run.endedAt ? Date.parse(run.endedAt) : Date.now();
  return (
    <div className="hd">
      <RunState state={run.state} outcome={run.outcome} detail={props.detail} />
      <h2>{props.title}</h2>
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
