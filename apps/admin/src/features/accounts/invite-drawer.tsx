"use client";

import { type AdminInvitation, signupPath } from "@weems/contrats";
import { useState } from "react";
import { invite } from "../../actions/accounts.ts";
import { shortDate } from "../../format/time.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { CloseIcon, CopyIcon } from "../../ui/icons.ts";

const ROLES = [
  { role: "pilot", label: "Pilote", help: "Enregistre ses vols, voit son espace sur le site." },
  { role: "admin", label: "Administrateur", help: "Accède aussi à cette page Comptes." },
] as const;

export const signupLink = (siteUrl: string, code: string) => `${siteUrl}${signupPath("fr", code)}`;

function Created({ invitation, siteUrl }: { invitation: AdminInvitation; siteUrl: string }) {
  const link = signupLink(siteUrl, invitation.code);
  return (
    <div className="result">
      Invitation créée pour <b>{invitation.email}</b>, valable jusqu&apos;au{" "}
      {shortDate(invitation.expiresAt)}. Envoyez ce lien par message privé :
      <div className="l">
        <code>{link}</code>
        <button className="btn sm ghost" onClick={() => void navigator.clipboard.writeText(link)}>
          <CopyIcon size={14} /> Copier
        </button>
      </div>
    </div>
  );
}

function RoleChoice(props: {
  role: "pilot" | "admin";
  disabled: boolean;
  onRole: (role: "pilot" | "admin") => void;
}) {
  return ROLES.map((item) => (
    <button
      type="button"
      key={item.role}
      className={`radio ${props.role === item.role ? "on" : ""}`}
      disabled={props.disabled}
      onClick={() => props.onRole(item.role)}
    >
      <span className="o" />
      <span>
        <b>{item.label}</b>
        <span>{item.help}</span>
      </span>
    </button>
  ));
}

function DrawerHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="hd">
      <h2>Créer un compte</h2>
      <button type="button" className="iconbtn" aria-label="Fermer" onClick={onClose}>
        <CloseIcon size={18} />
      </button>
    </div>
  );
}

function DrawerFooter(props: { created: boolean; busy: boolean; onClose: () => void }) {
  return (
    <div className="ft">
      <button type="button" className="btn ghost" onClick={props.onClose}>
        {props.created ? "Fermer" : "Annuler"}
      </button>
      {!props.created && (
        <button className="btn" type="submit" disabled={props.busy}>
          Créer l&apos;invitation
        </button>
      )}
    </div>
  );
}

/** « Créer un compte »: by invitation only (spec admin); the person chooses the password. */
export function InviteDrawer({ siteUrl, onClose }: { siteUrl: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"pilot" | "admin">("pilot");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminInvitation | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await invite({ email, role });
    setBusy(false);
    if (result.ok) setCreated(result.value);
    else setError(result.error);
  }

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <form
        className="drawer"
        onSubmit={(event) => void submit(event)}
        aria-label="Créer un compte"
      >
        <DrawerHeader onClose={onClose} />
        <div className="bd">
          <p className="muted">
            Une invitation de 14 jours, renouvelable. La personne choisit son nom et son mot de
            passe.
          </p>
          <label className="field">
            E-mail
            <input
              type="email"
              required
              value={email}
              disabled={created !== null}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <RoleChoice role={role} disabled={created !== null} onRole={setRole} />
          <ErrorBox message={error} />
          {created && <Created invitation={created} siteUrl={siteUrl} />}
        </div>
        <DrawerFooter created={created !== null} busy={busy} onClose={onClose} />
      </form>
    </>
  );
}
