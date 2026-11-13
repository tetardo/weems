"use client";

import type { AdminCampaign } from "@weems/contrats";
import { shortDate } from "../../format/time.ts";
import { DownloadIcon } from "../../ui/icons.ts";
import { StatusBadge } from "../../ui/status-badge.tsx";

const KIND: Record<AdminCampaign["kind"], string> = {
  batch: "Lot",
  referral: "Parrainage",
  shared: "Ambassadeur",
};

function State({ campaign, now }: { campaign: AdminCampaign; now: number }) {
  if (campaign.cancelledAt) return <StatusBadge tone="err">Annulé</StatusBadge>;
  if (campaign.expiresAt && Date.parse(campaign.expiresAt) <= now)
    return <StatusBadge tone="off">Expiré</StatusBadge>;
  if (campaign.used >= campaign.size && campaign.kind !== "referral")
    return <StatusBadge tone="off">Épuisé</StatusBadge>;
  return (
    <StatusBadge tone="ok" dot>
      Actif
    </StatusBadge>
  );
}

interface Props {
  campaigns: AdminCampaign[];
  busy: boolean;
  now: number;
  onCsv: (campaign: AdminCampaign) => void;
  onCancel: (campaign: AdminCampaign) => void;
}

function CampaignRow({
  campaign,
  ...props
}: Omit<Props, "campaigns"> & { campaign: AdminCampaign }) {
  return (
    <tr>
      <td>{KIND[campaign.kind]}</td>
      <td>
        {campaign.ambassador ?? campaign.label}
        {campaign.code && <span className="mono muted"> · {campaign.code}</span>}
      </td>
      <td>{campaign.months} mois</td>
      <td className="mono">
        {campaign.used} / {campaign.size}
      </td>
      <td className="muted">{campaign.expiresAt ? shortDate(campaign.expiresAt) : "—"}</td>
      <td>
        <State campaign={campaign} now={props.now} />
      </td>
      <td className="fd-actions">
        {campaign.kind === "batch" && (
          <button
            className="btn sm ghost"
            disabled={props.busy}
            onClick={() => props.onCsv(campaign)}
          >
            <DownloadIcon size={14} /> CSV
          </button>
        )}
        {campaign.kind !== "referral" && !campaign.cancelledAt && (
          <button
            className="btn sm ghost"
            disabled={props.busy}
            onClick={() => props.onCancel(campaign)}
          >
            Annuler
          </button>
        )}
      </td>
    </tr>
  );
}

const HEADINGS = ["Sorte", "Pour qui", "Offert", "Utilisés", "Fin", "État", ""];

/** Every batch, the referral codes and the ambassadors' codes, newest first. */
export function CampaignsTable({ campaigns, ...props }: Props) {
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
          {campaigns.map((campaign) => (
            <CampaignRow key={campaign.id} campaign={campaign} {...props} />
          ))}
        </tbody>
      </table>
      {campaigns.length === 0 && <p className="empty">Aucun code créé pour l&apos;instant.</p>}
    </div>
  );
}
