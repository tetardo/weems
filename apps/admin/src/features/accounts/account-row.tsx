"use client";

import type { AdminAccount, AdminInvitation } from "@weems/contrats";
import { ago, daysLeft, shortDate } from "../../format/time.ts";
import { AdminIcon, CopyIcon } from "../../ui/icons.ts";
import { StatusBadge } from "../../ui/status-badge.tsx";
import { RowMenu } from "./row-menu.tsx";
import { initialsOf } from "./rows.ts";

/** What a row can ask the page to do. */
export interface RowActions {
  setRole: (account: AdminAccount, role: "pilot" | "admin") => void;
  disable: (account: AdminAccount) => void;
  enable: (account: AdminAccount) => void;
  copyLink: (invitation: AdminInvitation) => void;
  renew: (invitation: AdminInvitation) => void;
  cancel: (invitation: AdminInvitation) => void;
}

const COLORS = ["#2b6cb0", "#7c3aed", "#d97706", "#0e8fa6", "#be185d", "#15803d"];
const colorOf = (text: string) =>
  COLORS[[...text].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length];

function Who(props: {
  initials: string;
  seed: string;
  name: string;
  sub: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="who">
      <span className="av" style={{ background: colorOf(props.seed) }}>
        {props.initials}
      </span>
      <div>
        <b>
          {props.name} {props.extra}
        </b>
        <span>{props.sub}</span>
      </div>
    </div>
  );
}

const Role = ({ role }: { role: "pilot" | "admin" }) =>
  role === "admin" ? (
    <StatusBadge tone="adm">
      <AdminIcon size={14} /> Administrateur
    </StatusBadge>
  ) : (
    <>Pilote</>
  );

export function AccountRow(props: { account: AdminAccount; me: string; actions: RowActions }) {
  const { account, actions } = props;
  const self = account.id === props.me;
  const menu = [
    account.role === "admin"
      ? { label: "Rendre pilote", onSelect: () => actions.setRole(account, "pilot") }
      : { label: "Rendre administrateur", onSelect: () => actions.setRole(account, "admin") },
    account.disabledAt
      ? { label: "Réactiver", onSelect: () => actions.enable(account) }
      : { label: "Désactiver", danger: true, onSelect: () => actions.disable(account) },
  ];
  return (
    <tr>
      <td>
        <Who
          initials={initialsOf(account.name)}
          seed={account.email}
          name={account.name}
          sub={self ? "vous" : account.email}
          extra={account.development && <StatusBadge tone="live">Développement</StatusBadge>}
        />
      </td>
      <td>
        <Role role={account.role} />
      </td>
      <td>
        {account.disabledAt ? (
          <StatusBadge tone="off">Désactivé</StatusBadge>
        ) : (
          <StatusBadge tone="ok">Actif</StatusBadge>
        )}
      </td>
      <td className="c">{account.flights}</td>
      <td>{shortDate(account.createdAt)}</td>
      <td>{account.lastLoginAt ? ago(account.lastLoginAt, Date.now()) : "—"}</td>
      <td className="act">
        {!self && (
          <RowMenu
            title={account.email}
            items={menu}
            note="Désactiver garde ses vols ; réactivable."
          />
        )}
      </td>
    </tr>
  );
}

export function InvitationRow({
  invitation,
  actions,
}: {
  invitation: AdminInvitation;
  actions: RowActions;
}) {
  const left = daysLeft(invitation.expiresAt, Date.now());
  const menu = [
    { label: "Copier le lien d'inscription", onSelect: () => actions.copyLink(invitation) },
    { label: "Renouveler (14 jours)", onSelect: () => actions.renew(invitation) },
    { label: "Annuler l'invitation", danger: true, onSelect: () => actions.cancel(invitation) },
  ];
  return (
    <tr>
      <td>
        <Who initials="?" seed={invitation.email} name="—" sub={invitation.email} />
      </td>
      <td>
        <Role role={invitation.role} />
      </td>
      <td>
        {left > 0 ? (
          <StatusBadge tone="warn">Invitation · expire dans {left} j</StatusBadge>
        ) : (
          <StatusBadge tone="err">Invitation expirée</StatusBadge>
        )}
      </td>
      <td className="c">—</td>
      <td>{shortDate(invitation.createdAt)}</td>
      <td>—</td>
      <td className="act">
        <button
          className="iconbtn"
          aria-label="Copier le lien"
          onClick={() => actions.copyLink(invitation)}
        >
          <CopyIcon size={16} />
        </button>
        <RowMenu title={invitation.email} items={menu} />
      </td>
    </tr>
  );
}
