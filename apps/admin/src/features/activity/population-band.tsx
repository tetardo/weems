"use client";

import { useState } from "react";
import type { ActivityView } from "../../server/activity/activity-view.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { ActivityIcon, AccountsIcon, DeleteIcon } from "../../ui/icons.ts";

type Population = NonNullable<ActivityView["population"]>;

function Numbers({ population }: { population: Population }) {
  return (
    <div className="nums">
      <div>
        <b>{population.accounts}</b>comptes
      </div>
      <div>
        <b>{population.flights}</b>vols
      </div>
      <div>
        <b>{population.publicProfiles}</b>profils publics
      </div>
    </div>
  );
}

function Title({ population }: { population: Population | null }) {
  if (!population) return <b>L&apos;API ne répond pas</b>;
  if (population.accounts === 0) {
    return (
      <div>
        <b>Aucune population fictive</b>
        <div className="sub">
          Le site ne contient que les comptes réels et le pilote de développement.
        </div>
      </div>
    );
  }
  return (
    <div>
      <b>Population fictive en base</b>
      <div className="sub">Comptes marqués « fictif », vols simulés (déclarés MSFS 2024)</div>
    </div>
  );
}

/** What the fictitious population holds now, and « Tout supprimer » (spec admin). */
export function PopulationBand(props: {
  population: Population | null;
  disabled: boolean;
  busy: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const { population } = props;
  const some = population !== null && population.accounts > 0;
  return (
    <section className="panel popband">
      <span className="ic">
        <ActivityIcon size={20} />
      </span>
      <Title population={population} />
      {some && <Numbers population={population} />}
      {some && (
        <div className="acts">
          <a className="btn ghost sm" href="/accounts">
            <AccountsIcon size={15} /> Voir dans Comptes
          </a>
          <button
            className="btn danger sm"
            disabled={props.disabled}
            onClick={() => setConfirming(true)}
          >
            <DeleteIcon size={15} /> Tout supprimer
          </button>
        </div>
      )}
      {confirming && some && (
        <ConfirmDialog
          title="Supprimer la population fictive ?"
          confirmLabel="Tout supprimer"
          busy={props.busy}
          onCancel={() => setConfirming(false)}
          onConfirm={() => void props.onDelete().then(() => setConfirming(false))}
        >
          <p>
            {population.accounts} comptes fictifs, leurs {population.flights} vols et leurs{" "}
            {population.publicProfiles} profils publics seront effacés.
          </p>
          <p className="muted">
            Les comptes réels, le pilote de développement et ses vols MSFS ne sont pas touchés.
          </p>
        </ConfirmDialog>
      )}
    </section>
  );
}
