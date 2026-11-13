"use client";

import type { AdminAccount, AdminInvitation } from "@weems/contrats";
import { ago, daysLeft, shortDate } from "../../format/time.ts";
import { AdminIcon, CopyIcon, LinkIcon, ProfileIcon } from "../../ui/icons.ts";
import { StatusBadge } from "../../ui/status-badge.tsx";
import { RowMenu } from "./row-menu.tsx";
import { initialsOf, PLAN_LABELS } from "./rows.ts";

/** What a row can ask the page to do. */
export interface RowActions {
  setRole: (account: AdminAccount, role: "pilot" | "admin") => void;
  disable: (account: AdminAccount) => void;
  enable: (account: AdminAccount) => void;
  copyLink: (invitation: AdminInvitation) => void;
  copyCode: (invitation: AdminInvitation) => void;
  renew: (invitation: AdminInvitation) => void;
  cancel: (invitation: AdminInvitation) => void;
  /** Address of a public profile on the local site. */
  profileUrl: (handle: string) => string;
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
      <div className="tx">
        <div className="nm">
          <b title={props.name}>{props.name}</b>
          {props.extra}
        </div>
        <span className="sub" title={props.sub}>
          {props.sub}
        </span>
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

const AccountBadges = ({ account }: { account: AdminAccount }) => (
  <>
    {account.development && <StatusBadge tone="live">Développement</StatusBadge>}
    {account.fictitious && <StatusBadge tone="warn">Fictif</StatusBadge>}
  </>
);

/** Fixed slots of the actions column (link, then menu): an absent action leaves its place empty. */
const Slots = ({ link, menu }: { link?: React.ReactNode; menu?: React.ReactNode }) => (
  <div className="slots">
    {link || <span />}
    {menu || <span />}
  </div>
);

/** Opens the public profile on the local site, for real and fictitious accounts alike. */
const ProfileLink = ({ name, href }: { name: string; href: string }) => (
  <a
    className="iconbtn"
    href={href}
    target="_blank"
    rel="noreferrer"
    aria-label={`Voir le profil public de ${name}`}
    title="Voir le profil public"
  >
    <ProfileIcon size={16} />
  </a>
);

/** Profile link and « … » menu of an account (no menu on one's own row). */
function AccountActions(props: { account: AdminAccount; self: boolean; actions: RowActions }) {
  const { account, actions } = props;
  const menu = [
    account.role === "admin"
      ? { label: "Rendre pilote", onSelect: () => actions.setRole(account, "pilot") }
      : { label: "Rendre administrateur", onSelect: () => actions.setRole(account, "admin") },
    account.disabledAt
      ? { label: "Activer le compte", onSelect: () => actions.enable(account) }
      : { label: "Désactiver le compte", danger: true, onSelect: () => actions.disable(account) },
  ];
  return (
    <Slots
      link={
        account.publicHandle && (
          <ProfileLink name={account.name} href={actions.profileUrl(account.publicHandle)} />
        )
      }
      menu={
        !props.self && (
          <RowMenu
            title={account.email}
            items={menu}
            note="Désactivé : plus de connexion, sessions coupées ; ses vols restent."
          />
        )
      }
    />
  );
}

export function AccountRow(props: { account: AdminAccount; me: string; actions: RowActions }) {
  const { account } = props;
  const self = account.id === props.me;
  return (
    <tr>
      <td className="who-cell">
        <Who
          initials={initialsOf(account.name)}
          seed={account.email}
          name={account.name}
          sub={self ? "vous" : account.email}
          extra={<AccountBadges account={account} />}
        />
      </td>
      <td>
        <Role role={account.role} />
      </td>
      <td>
        <span className={account.plan === "pilot_free" ? "plan" : "plan paid"}>
          {PLAN_LABELS[account.plan]}
        </span>
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
        <AccountActions account={account} self={self} actions={props.actions} />
      </td>
    </tr>
  );
}

/** The invitation code, with a button that copies it (tab Invitations). */
const InvitationCode = ({
  invitation,
  actions,
}: {
  invitation: AdminInvitation;
  actions: RowActions;
}) => (
  <span className="code">
    <code>{invitation.code}</code>
    <button
      className="iconbtn"
      aria-label={`Copier le code d'invitation de ${invitation.email}`}
      title="Copier le code"
      onClick={() => actions.copyCode(invitation)}
    >
      <CopyIcon size={16} />
    </button>
  </span>
);

/** Copy the sign-up link, then the « … » menu of an invitation. */
function InvitationActions({
  invitation,
  actions,
}: {
  invitation: AdminInvitation;
  actions: RowActions;
}) {
  const menu = [
    { label: "Copier le lien d'inscription", onSelect: () => actions.copyLink(invitation) },
    { label: "Copier le code d'invitation", onSelect: () => actions.copyCode(invitation) },
    { label: "Renouveler (14 jours)", onSelect: () => actions.renew(invitation) },
    { label: "Annuler l'invitation", danger: true, onSelect: () => actions.cancel(invitation) },
  ];
  return (
    <Slots
      link={
        <button
          className="iconbtn"
          aria-label="Copier le lien d'inscription"
          title="Copier le lien d'inscription"
          onClick={() => actions.copyLink(invitation)}
        >
          <LinkIcon size={16} />
        </button>
      }
      menu={<RowMenu title={invitation.email} items={menu} />}
    />
  );
}

/** An invitation: its code in the column Formule/Code when the tab shows invitations only. */
export function InvitationRow({
  invitation,
  actions,
  showCode,
}: {
  invitation: AdminInvitation;
  actions: RowActions;
  showCode: boolean;
}) {
  const left = daysLeft(invitation.expiresAt, Date.now());
  return (
    <tr>
      <td className="who-cell">
        <Who initials="?" seed={invitation.email} name="—" sub={invitation.email} />
      </td>
      <td>
        <Role role={invitation.role} />
      </td>
      <td>{showCode ? <InvitationCode invitation={invitation} actions={actions} /> : "—"}</td>
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
        <InvitationActions invitation={invitation} actions={actions} />
      </td>
    </tr>
  );
}
