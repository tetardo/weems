import type { AdminDatabase } from "@weems/contrats";
import { shortDate } from "../../format/time.ts";
import { MigrationsIcon } from "../../ui/icons.ts";
import { Block } from "../../ui/block.tsx";
import { migrationLabel, migrationSummary, migrationTone } from "./model.ts";

/** Why a row in excess changes nothing, or why an anomaly needs a hand. */
function Hints({ harmless, broken }: { harmless: boolean; broken: boolean }) {
  return (
    <>
      {harmless && (
        <p className="db-hint muted">
          Une ligne en trop dans <code>drizzle.__drizzle_migrations</code>, plus ancienne que la
          dernière migration, ne change rien : Drizzle ne regarde que la plus récente. Elle peut
          être retirée à la main.
        </p>
      )}
      {broken && (
        <p className="db-hint">
          Une migration sautée, modifiée, en double ou inconnue ne se répare pas d’un clic : il faut
          corriger la table <code>drizzle.__drizzle_migrations</code> à la main.
        </p>
      )}
    </>
  );
}

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
            <span className={`db-pill ${migrationTone(m, props.migrations)}`}>
              {migrationLabel(m, props.migrations)}
            </span>
          </div>
        ))}
      </div>
      <Hints harmless={summary.harmless > 0} broken={summary.tone === "bad"} />
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
