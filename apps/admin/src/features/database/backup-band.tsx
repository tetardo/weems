import { BackupIcon, WarningIcon } from "../../ui/icons.ts";

/** Shown when there is no backup, or the newest is older than 7 days. */
export function BackupBand(props: { warning: string | null; busy: boolean; onBackup: () => void }) {
  if (!props.warning) return null;
  return (
    <div className="sv-alert" role="status">
      <WarningIcon size={16} />
      <b>{props.warning}</b>
      <span>Un volume Docker supprimé ou une mauvaise commande, et les vols sont perdus.</span>
      <button className="btn db-push" disabled={props.busy} onClick={props.onBackup}>
        <BackupIcon size={16} />
        {props.busy ? "Sauvegarde…" : "Sauvegarder maintenant"}
      </button>
    </div>
  );
}
