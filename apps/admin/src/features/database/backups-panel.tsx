import { bytes } from "@weems/ui/format";
import { dayAndClock } from "../../format/time.ts";
import type { DatabaseView } from "../../server/database/database-page.ts";
import { BackupIcon } from "../../ui/icons.ts";
import { Block } from "../../ui/block.tsx";

/** Backups in apps/admin/.data/backups, newest first, and how to restore one. */
export function BackupsPanel(props: {
  backups: DatabaseView["backups"];
  busy: boolean;
  onBackup: () => void;
}) {
  const [newest] = props.backups;
  return (
    <Block
      icon={<BackupIcon size={17} />}
      title="Sauvegardes"
      hint="7 gardées · apps/admin/.data/backups"
    >
      {props.backups.length === 0 ? (
        <p className="db-empty muted">Aucune sauvegarde pour l’instant.</p>
      ) : (
        <div className="db-list">
          {props.backups.map((file) => (
            <div className="db-line" key={file.name}>
              <span className="mono db-tag">{dayAndClock(file.createdAt)}</span>
              <span className="muted db-date">{bytes(file.bytes)}</span>
              <span className="db-pill ok">ok</span>
            </div>
          ))}
        </div>
      )}
      {newest && (
        <>
          <p className="db-hint muted">
            Restaurer remplace toute la base : à faire à la main, API arrêtée, depuis la racine du
            dépôt.
          </p>
          <code className="db-cmd">{newest.restore}</code>
        </>
      )}
      <div className="db-foot">
        <span className="muted">pg_dump dans le conteneur de la base.</span>
        <button className="btn db-push" disabled={props.busy} onClick={props.onBackup}>
          <BackupIcon size={16} />
          {props.busy ? "Sauvegarde…" : "Sauvegarder maintenant"}
        </button>
      </div>
    </Block>
  );
}
