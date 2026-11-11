"use client";

import { useState } from "react";
import { logIn } from "../../actions/accounts.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { AdminIcon } from "../../ui/icons.ts";

/** Only this page asks for a login (spec admin): an administrator account of the local API. */
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
        Compte administrateur de l&apos;API locale. Le premier se nomme avec{" "}
        <span className="mono">pnpm --filter @weems/api make-admin &lt;e-mail&gt;</span>.
      </p>
      <label className="field">
        E-mail
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="field">
        Mot de passe
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <ErrorBox message={error} />
      <button className="btn" type="submit" disabled={busy}>
        Se connecter
      </button>
    </form>
  );
}
