"use client";

import { DEV_PILOT_LOGIN } from "@weems/contrats";
import { FormField } from "@weems/ui";
import { useState } from "react";
import { logIn } from "../../actions/accounts.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { AdminIcon } from "../../ui/icons.ts";

/** Makes the development pilot an administrator: the console then logs in by itself (fiche 012). */
const MAKE_DEV_ADMIN = `pnpm --filter @weems/api make-admin ${DEV_PILOT_LOGIN.email}`;

/** Only this page asks for a login (console spec): an administrator account of the local API. */
export function LoginForm({ reason, onDone }: { reason: string | null; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(reason);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await logIn(email, password);
    setBusy(false);
    if (result.ok) onDone();
    else setError(result.error);
  }

  return (
    <form className="panel loginbox" onSubmit={(event) => void submit(event)}>
      <div className="lk">
        <AdminIcon size={22} />
      </div>
      <h2>Connexion administrateur</h2>
      <p className="muted">
        Compte administrateur de l&apos;API locale. Hors production, la console se connecte seule
        avec le pilote de développement une fois nommé administrateur :{" "}
        <span className="mono">{MAKE_DEV_ADMIN}</span>, puis la page s&apos;ouvre seule.
      </p>
      <FormField
        label="E-mail"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormField
        label="Mot de passe"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <ErrorBox message={error} />
      <button className="btn" type="submit" disabled={busy}>
        Se connecter
      </button>
    </form>
  );
}
