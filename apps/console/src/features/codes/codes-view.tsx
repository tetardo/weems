"use client";

import type { AdminAmbassador, AdminCampaign } from "@weems/contrats";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type CodesPage, campaignCsv, cancelCampaign } from "../../actions/offers.ts";
import { shortDate } from "../../format/time.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import { AmbassadorIcon, CodesIcon, ExternalIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { StatusBadge } from "../../ui/status-badge.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { AmbassadorDrawer } from "./ambassador-drawer.tsx";
import { BatchForm } from "./batch-form.tsx";
import { CampaignsTable } from "./campaigns-table.tsx";

/** Saves the CSV of a batch through the browser. */
function saveFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  link.click();
  URL.revokeObjectURL(url);
}

function AmbassadorCard(props: {
  ambassador: AdminAmbassador;
  siteUrl: string;
  onOpen: () => void;
}) {
  const { ambassador } = props;
  return (
    <div className="panel oc-amb">
      <div className="oc-amb-hd">
        <b>{ambassador.name}</b>
        {ambassador.active ? (
          <StatusBadge tone="ok" dot>
            En ligne
          </StatusBadge>
        ) : (
          <StatusBadge tone="off">Hors ligne</StatusBadge>
        )}
      </div>
      <p className="mono">{ambassador.offer.code}</p>
      <p className="muted">
        {ambassador.used} / {ambassador.offer.places} pilotes · {ambassador.offer.months} mois ·
        jusqu&apos;au {shortDate(ambassador.offer.expiresAt)}
      </p>
      <div className="oc-amb-ft">
        <a
          className="btn sm ghost"
          href={`${props.siteUrl}/fr/ambassadors/${ambassador.slug}`}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalIcon size={14} /> Page
        </a>
        <button className="btn sm ghost" onClick={props.onOpen}>
          Modifier
        </button>
      </div>
    </div>
  );
}

type Drawer = { ambassador: AdminAmbassador | null } | null;

function Title({ onNew }: { onNew: () => void }) {
  return (
    <PageTitle
      icon={<CodesIcon />}
      title="Codes d'offre"
      subtitle="Pilot Pro offert par un code : lots à usage unique (WEEMS-XXXX-XXXX), codes partagés des ambassadeurs, parrainage des fondateurs."
      actions={
        <button className="btn" onClick={onNew}>
          <AmbassadorIcon size={16} /> Nouvel ambassadeur
        </button>
      }
    />
  );
}

function Ambassadors(props: { page: CodesPage; onOpen: (a: AdminAmbassador) => void }) {
  const { ambassadors, siteUrl } = props.page;
  return (
    <>
      <h2 className="oc-h">Ambassadeurs</h2>
      <div className="oc-ambs">
        {ambassadors.map((ambassador) => (
          <AmbassadorCard
            key={ambassador.slug}
            ambassador={ambassador}
            siteUrl={siteUrl}
            onOpen={() => props.onOpen(ambassador)}
          />
        ))}
        {ambassadors.length === 0 && (
          <p className="muted">Aucun ambassadeur pour l&apos;instant.</p>
        )}
      </div>
    </>
  );
}

function CancelDialog(props: {
  campaign: AdminCampaign;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      title={`Annuler « ${props.campaign.ambassador ?? props.campaign.label} » ?`}
      confirmLabel="Annuler les codes"
      busy={props.busy}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
    >
      <p>Les codes non utilisés ne marchent plus. Les mois déjà offerts restent acquis.</p>
    </ConfirmDialog>
  );
}

async function downloadCsv(campaign: AdminCampaign) {
  const result = await campaignCsv(campaign.id);
  if (result.ok) saveFile(`codes-${campaign.label.replace(/\W+/g, "-")}.csv`, result.value);
}

/** Page Codes d'offre (spec offre fondateurs): batches of single-use codes, ambassadors. */
export function CodesView({ page }: { page: CodesPage }) {
  const router = useRouter();
  const refresh = async () => router.refresh();
  const { busy, error, run } = useActionRunner(refresh);
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [cancelling, setCancelling] = useState<AdminCampaign | null>(null);
  const [now] = useState(() => Date.now());
  return (
    <>
      <Title onNew={() => setDrawer({ ambassador: null })} />
      <ErrorBox message={error} />
      <Ambassadors page={page} onOpen={(ambassador) => setDrawer({ ambassador })} />
      <h2 className="oc-h">Lots et codes</h2>
      <BatchForm busy={busy} run={run} />
      <CampaignsTable
        campaigns={page.campaigns}
        busy={busy}
        now={now}
        onCsv={(campaign) => void downloadCsv(campaign)}
        onCancel={setCancelling}
      />
      {drawer && (
        <AmbassadorDrawer
          ambassador={drawer.ambassador}
          onClose={() => setDrawer(null)}
          onSaved={refresh}
        />
      )}
      {cancelling && (
        <CancelDialog
          campaign={cancelling}
          busy={busy}
          onCancel={() => setCancelling(null)}
          onConfirm={() =>
            void run(() => cancelCampaign(cancelling.id)).then(() => setCancelling(null))
          }
        />
      )}
    </>
  );
}
