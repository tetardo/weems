import { dayAndClock } from "../../format/time.ts";
import type { HistoryEntry } from "../../server/traffic/history.ts";
import { StatusBadge } from "../../ui/status-badge.tsx";
import { OUTCOMES } from "../../ui/run-state.tsx";

export function HistoryPanel({ history }: { history: HistoryEntry[] }) {
  return (
    <section className="panel hist">
      <h2>Derniers lancements</h2>
      {history.length === 0 && <div className="empty">Aucun lancement pour l&apos;instant.</div>}
      {history.map((entry) => {
        const outcome = OUTCOMES[entry.outcome];
        return (
          <div className="it" key={entry.id}>
            <span className="d">{dayAndClock(entry.startedAt)}</span>
            <b>{entry.kind === "simulate" ? "Pilotes simulés" : "Test de charge"}</b>
            <span className="muted hide">{entry.summary}</span>
            <StatusBadge tone={outcome.tone}>{entry.detail ?? outcome.label}</StatusBadge>
          </div>
        );
      })}
    </section>
  );
}
