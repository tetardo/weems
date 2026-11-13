"use client";

import { useState } from "react";
import type { DevFlightCounts } from "@weems/contrats";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { DeleteIcon } from "../../ui/icons.ts";

/** Simulated flights of the development pilot; its real flights (pnpm fly) are never deleted. */
export function SimulatedFlightsPanel(props: {
  counts: DevFlightCounts | null;
  disabled: boolean;
  busy: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const { counts } = props;
  return (
    <section className="panel purge">
      <h2>Vols simulés en base</h2>
      <div className="pb">
        {counts ? (
          <>
            <div className="big">
              {counts.simulated} <small>vols</small>
            </div>
            <p className="muted">
              Vols « replay » du pilote de développement. Ses vols MSFS (
              <span className="mono">pnpm fly</span>) ne sont jamais supprimés :{" "}
              <b>{counts.real}</b> vols conservés.
            </p>
          </>
        ) : (
          <p className="muted">L&apos;API ne répond pas.</p>
        )}
        <button
          className="btn danger"
          disabled={!counts || counts.simulated === 0 || props.disabled}
          onClick={() => setConfirming(true)}
        >
          <DeleteIcon size={16} /> Supprimer les vols simulés
        </button>
      </div>
      {confirming && counts && (
        <ConfirmDialog
          title={`Supprimer ${counts.simulated} vols simulés ?`}
          confirmLabel="Supprimer"
          busy={props.busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void props.onDelete().then(() => setConfirming(false))}
        >
          <p className="muted">
            Événements, trajectoires et vérifications compris. Les vols MSFS restent.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
