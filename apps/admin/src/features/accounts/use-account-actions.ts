"use client";

import type { AdminAccount } from "@weems/contrats";
import { useState } from "react";
import { cancelInvitation, renewInvitation, updateAccount } from "../../actions/accounts.ts";
import type { ActionResult } from "../../actions/result.ts";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import type { RowActions } from "./account-row.tsx";
import { signupLink } from "./invite-drawer.tsx";

/** Row actions of the page Comptes, with a line saying what was done; disabling asks first. */
export function useAccountActions(siteUrl: string, refresh: () => Promise<void>) {
  const { error, run } = useActionRunner(refresh);
  const [message, setMessage] = useState<string | null>(null);
  const [toDisable, setToDisable] = useState<AdminAccount | null>(null);
  const act = async <T>(action: () => Promise<ActionResult<T>>, done: string) =>
    setMessage((await run(action)) ? done : null);

  const actions: RowActions = {
    setRole: (account, role) =>
      void act(
        () => updateAccount(account.id, { role }),
        `${account.email} est maintenant ${role === "admin" ? "administrateur" : "pilote"}.`,
      ),
    disable: setToDisable,
    enable: (account) =>
      void act(
        () => updateAccount(account.id, { disabled: false }),
        `${account.email} est réactivé.`,
      ),
    copyLink: (invitation) => {
      void navigator.clipboard.writeText(signupLink(siteUrl, invitation.code));
      setMessage(`Lien d'inscription de ${invitation.email} copié.`);
    },
    renew: (invitation) =>
      void act(
        () => renewInvitation(invitation.code),
        `Invitation de ${invitation.email} renouvelée : l'ancien lien ne marche plus.`,
      ),
    cancel: (invitation) =>
      void act(
        () => cancelInvitation(invitation.code),
        `Invitation de ${invitation.email} annulée.`,
      ),
  };

  async function confirmDisable(account: AdminAccount) {
    await act(
      () => updateAccount(account.id, { disabled: true }),
      `${account.email} est désactivé.`,
    );
    setToDisable(null);
  }

  return {
    actions,
    message,
    error,
    toDisable,
    cancelDisable: () => setToDisable(null),
    confirmDisable,
  };
}
