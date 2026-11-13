"use client";

import type { DatabaseCleanupRequest } from "@weems/contrats";
import { useState } from "react";
import { bytes } from "@weems/ui/format";
import type { DatabaseView } from "../../server/database/database-page.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { CleanupIcon, LockIcon } from "../../ui/icons.ts";
import { type CleanupChoice, cleanupLines } from "./model.ts";

type Preview = DatabaseView["database"]["cleanup"];

const NONE: DatabaseCleanupRequest = {
  simulatedFlights: false,
  expiredSessions: false,
  expiredInvitations: false,
};

function Choice(props: {
  id: CleanupChoice;
  title: string;
  detail: string;
  count: string;
  size?: string;
  choice: DatabaseCleanupRequest;
  onChange: (choice: DatabaseCleanupRequest) => void;
}) {
  return (
    <label className="db-choice">
      <input
        type="checkbox"
        name={props.id}
        checked={props.choice[props.id]}
        onChange={(event) => props.onChange({ ...props.choice, [props.id]: event.target.checked })}
      />
      <span>
        {props.title}
        <small className="muted">{props.detail}</small>
      </span>
      <span className="mono db-count">
        {props.count}
        {props.size && <small className="muted">{props.size}</small>}
      </span>
    </label>
  );
}

/** The three things the cleanup can delete, with how many there are now. */
function Choices(props: {
  preview: Preview;
  choice: DatabaseCleanupRequest;
  onChange: (choice: DatabaseCleanupRequest) => void;
}) {
  const { preview } = props;
  const shared = { choice: props.choice, onChange: props.onChange };
  return (
    <>
      <Choice
        id="simulatedFlights"
        title={`Vols simulés de plus de ${preview.olderThanDays} jours`}
        detail="rejoués par pnpm simulate ou pnpm load, avec leurs événements et trajectoires"
        count={`${preview.simulatedFlights.count} vols`}
        size={bytes(preview.simulatedFlights.bytes)}
        {...shared}
      />
      <Choice
        id="expiredSessions"
        title="Sessions expirées"
        detail="connexions au site terminées"
        count={String(preview.expiredSessions)}
        {...shared}
      />
      <Choice
        id="expiredInvitations"
        title="Invitations expirées"
        detail="jamais utilisées dans leurs 14 jours"
        count={String(preview.expiredInvitations)}
        {...shared}
      />
    </>
  );
}

function Confirm(props: {
  lines: string[];
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      title="Supprimer définitivement ?"
      confirmLabel={props.busy ? "Suppression…" : "Supprimer"}
      busy={props.busy}
      onConfirm={props.onConfirm}
      onCancel={props.onCancel}
    >
      <ul className="db-confirm">
        {props.lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="muted">
        Impossible à annuler. Les vols réels ne sont pas touchés. Fais une sauvegarde avant pour
        pouvoir revenir en arrière.
      </p>
    </ConfirmDialog>
  );
}

const ticked = (count: number) =>
  count ? `${count} choix coché${count > 1 ? "s" : ""}` : "Rien de coché.";

/** What can be deleted, ticked, then confirmed: never a real flight (EF-14). */
export function CleanupPanel(props: {
  preview: Preview;
  busy: boolean;
  result: string | null;
  onClean: (choice: DatabaseCleanupRequest) => Promise<boolean>;
}) {
  const [choice, setChoice] = useState(NONE);
  const [confirming, setConfirming] = useState(false);
  const lines = cleanupLines(props.preview, choice);
  const confirm = async () => {
    if (await props.onClean(choice)) setChoice(NONE);
    setConfirming(false);
  };
  return (
    <section className="sv-section">
      <h2>Nettoyage</h2>
      <div className="panel db-clean">
        <Choices preview={props.preview} choice={choice} onChange={setChoice} />
        <p className="db-lock">
          <LockIcon size={16} />
          Les vols réels ne sont jamais supprimés (EF-14), ni ceux des comptes fictifs, dont
          l’historique est daté dans le passé exprès. La suppression passe par l’API.
        </p>
        <div className="db-foot">
          <span className={props.result ? "db-ok" : "muted"}>
            {props.result ?? ticked(lines.length)}
          </span>
          <button
            className="btn danger"
            disabled={props.busy || lines.length === 0}
            onClick={() => setConfirming(true)}
          >
            <CleanupIcon size={16} />
            Nettoyer…
          </button>
        </div>
      </div>
      {confirming && (
        <Confirm
          lines={lines}
          busy={props.busy}
          onConfirm={() => void confirm()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
