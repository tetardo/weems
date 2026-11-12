import type { AdminDatabase } from "@weems/contrats";
import { shortDate } from "../../format/time.ts";
import { MigrationsIcon } from "../../ui/icons.ts";
import { Block } from "../../ui/block.tsx";
import { MIGRATION_LABELS, migrationSummary, migrationTone } from "./model.ts";

/** Each migration of the code (and any unknown one) with its state; newest first. */
export function MigrationsPanel(props: {
  migrations: AdminDatabase["migrations"];
  busy: boolean;
  onApply: () => void;
}) {
  const summary = migrationSummary(props.migrations);
  return (
    <Block
      icon={<MigrationsIcon size={17} />}
      title="Migrations"
      hint={`code ${summary.inCode} · base ${summary.applied}`}
    >
      <div className="db-list">
        {props.migrations.map((m, index) => (
          <div className="db-line" key={`${m.tag ?? "unknown"}-${m.createdAt}-${index}`}>
            <span className="mono db-tag">{m.tag ?? "—"}</span>
            <span className="muted db-date">{shortDate(m.createdAt)}</span>
            <span className={`db-pill ${migrationTone(m.state)}`}>{MIGRATION_LABELS[m.state]}</span>
          </div>
        ))}
      </div>
      {summary.tone === "bad" && (
        <p className="db-hint">
          Une migration sautée, modifiée, en double ou inconnue ne se répare pas d’un clic : il faut
          corriger la table <code>drizzle.__drizzle_migrations</code> à la main.
        </p>
      )}
      <div className="db-foot">
        <span className="muted">
          {summary.pending ? `${summary.pending} à appliquer.` : "Rien à appliquer."}
        </span>
        <button
          className="btn"
          disabled={props.busy || summary.pending === 0}
          onClick={props.onApply}
        >
          <MigrationsIcon size={16} />
          {props.busy ? "Application…" : "Appliquer les migrations"}
        </button>
      </div>
    </Block>
  );
}
