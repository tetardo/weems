import { StatusBadge, type Tone } from "./status-badge.tsx";

export type RunOutcome = "success" | "failed" | "stopped";

export const OUTCOMES: Record<RunOutcome, { tone: Tone; label: string }> = {
  success: { tone: "ok", label: "Réussi" },
  failed: { tone: "err", label: "Raté" },
  stopped: { tone: "off", label: "Arrêté" },
};

/** State of a run (pages Trafic simulé and Activité simulée): en cours, arrêt…, or its outcome. */
export function RunState(props: {
  state: "running" | "stopping" | "ended";
  outcome: RunOutcome | null;
  detail?: string | null | undefined;
}) {
  if (props.state === "running")
    return (
      <StatusBadge tone="live" dot>
        En cours
      </StatusBadge>
    );
  if (props.state === "stopping")
    return (
      <StatusBadge tone="warn" dot>
        Arrêt…
      </StatusBadge>
    );
  const outcome = OUTCOMES[props.outcome ?? "stopped"];
  return (
    <StatusBadge tone={outcome.tone}>
      {props.detail ? `${outcome.label} · ${props.detail}` : outcome.label}
    </StatusBadge>
  );
}
