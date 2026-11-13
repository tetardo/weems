"use client";

import type { AdminFounder, AdminFounders } from "@weems/contrats";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { decideFounder } from "../../actions/offers.ts";
import { dayAndClock } from "../../format/time.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import { FoundersIcon, InfoIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { StatusBadge, type Tone } from "../../ui/status-badge.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";

const STATUS: Record<AdminFounder["status"], [Tone, string]> = {
  pending: ["warn", "En vérification"],
  confirmed: ["ok", "Confirmé"],
  refused: ["err", "Refusé"],
};

function Tiles({ page }: { page: AdminFounders }) {
  const taken = page.confirmed + page.pending;
  const tiles: [string, number | string][] = [
    ["Confirmés", page.confirmed],
    ["En vérification (48 h)", page.pending],
    ["Refusés (numéro perdu)", page.refused],
    ["Places libres", `${page.places - taken} / ${page.places}`],
  ];
  return (
    <div className="tiles">
      {tiles.map(([label, value]) => (
        <div key={label} className="tile">
          <span>{label}</span>
          <b>{value}</b>
        </div>
      ))}
    </div>
  );
}

interface RowProps {
  founder: AdminFounder;
  busy: boolean;
  onConfirm: (founder: AdminFounder) => void;
  onRefuse: (founder: AdminFounder) => void;
}

function FounderRow({ founder, busy, onConfirm, onRefuse }: RowProps) {
  const [tone, label] = STATUS[founder.status];
  return (
    <tr>
      <td className="mono">
        <b>n° {founder.number}</b>
      </td>
      <td>{founder.name ?? <span className="muted">compte supprimé</span>}</td>
      <td>
        <StatusBadge tone={tone} dot>
          {label}
        </StatusBadge>
      </td>
      <td className="muted">{dayAndClock(founder.qualifiedAt)}</td>
      <td className="muted">
        {founder.status === "refused" && founder.refusedAt
          ? `refusé ${dayAndClock(founder.refusedAt)}`
          : dayAndClock(founder.confirmsAt)}
      </td>
      <td>
        <div className="fd-actions">
          {founder.status === "pending" && (
            <button className="btn sm" disabled={busy} onClick={() => onConfirm(founder)}>
              Confirmer
            </button>
          )}
          {founder.status !== "refused" && (
            <button className="btn sm ghost" disabled={busy} onClick={() => onRefuse(founder)}>
              Refuser
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function RefuseDialog(props: {
  founder: AdminFounder;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      title={`Refuser le fondateur n° ${props.founder.number} ?`}
      confirmLabel="Refuser la place"
      busy={props.busy}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
    >
      <p>
        {props.founder.name ?? "Ce pilote"} perd son badge, son Pilot Pro offert et ses codes de
        parrainage non utilisés. Le numéro n° {props.founder.number} n&apos;est jamais redonné : la
        place revient au suivant.
      </p>
    </ConfirmDialog>
  );
}

function Rules() {
  return (
    <div className="note fd-note">
      <InfoIcon size={16} />
      <div>
        Une place gagnée est confirmée seule après 48 h. Refusez-la si les vols semblent falsifiés
        (trajets impossibles, vols identiques en série).
      </div>
    </div>
  );
}

const HEADINGS = ["Numéro", "Pilote", "État", "Place gagnée", "Confirmation", ""];

function FoundersTable(props: Omit<RowProps, "founder"> & { founders: AdminFounder[] }) {
  const { founders, ...row } = props;
  return (
    <div className="panel scroll-x">
      <table>
        <thead>
          <tr>
            {HEADINGS.map((heading) => (
              <th key={heading}>{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {founders.map((founder) => (
            <FounderRow key={founder.number} founder={founder} {...row} />
          ))}
        </tbody>
      </table>
      {founders.length === 0 && <p className="empty">Aucune place gagnée pour l&apos;instant.</p>}
    </div>
  );
}

/** Page Fondateurs (spec offre fondateurs): check the places won, confirm or refuse them. */
export function FoundersView({ page }: { page: AdminFounders }) {
  const router = useRouter();
  const { busy, error, run } = useActionRunner(async () => router.refresh());
  const [refusing, setRefusing] = useState<AdminFounder | null>(null);
  return (
    <>
      <PageTitle
        icon={<FoundersIcon />}
        title="Pilotes fondateurs"
        subtitle="Les 500 premiers pilotes avec 3 vols valides sur 2 jours : Pilot Pro offert un an et badge numéroté à vie."
      />
      <Tiles page={page} />
      <Rules />
      <ErrorBox message={error} />
      <FoundersTable
        founders={page.founders}
        busy={busy}
        onConfirm={(f) => void run(() => decideFounder(f.number, "confirm"))}
        onRefuse={setRefusing}
      />
      {refusing && (
        <RefuseDialog
          founder={refusing}
          busy={busy}
          onCancel={() => setRefusing(null)}
          onConfirm={() =>
            void run(() => decideFounder(refusing.number, "refuse")).then(() => setRefusing(null))
          }
        />
      )}
    </>
  );
}
