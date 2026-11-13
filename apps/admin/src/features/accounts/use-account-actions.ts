"use client";

import type { AdminAccount, AdminInvitation } from "@weems/contrats";
import { useState } from "react";
import { cancelInvitation, renewInvitation, updateAccount } from "../../actions/accounts.ts";
import type { ActionResult } from "../../actions/result.ts";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import type { RowActions } from "./account-row.tsx";
import { signupLink } from "./invite-drawer.tsx";

/** Copies the sign-up link or the bare code of an invitation, and says so. */
function copyActions(siteUrl: string, say: (message: string) => void) {
  const copy = (text: string, message: string) =>
    void navigator.clipboard.writeText(text).then(
      () => say(message),
      () => say(`Copie refusée par le navigateur : ${text}`),
    );
  return {
    copyLink: (invitation: AdminInvitation) =>
      copy(
        signupLink(siteUrl, invitation.code),
        `Lien d'inscription de ${invitation.email} copié.`,
      ),
    copyCode: (invitation: AdminInvitation) =>
      copy(invitation.code, `Code d'invitation de ${invitation.email} copié : ${invitation.code}.`),
  };
}

/** Row actions of the page Comptes, with a line saying what was done; disabling asks first. */
export function useAccountActions(siteUrl: string, refresh: () => Promise<void>) {
  const { error, run } = useActionRunner(refresh);
  const [message, setMessage] = useState<string | null>(null);
  const [toDisable, setToDisable] = useState<AdminAccount | null>(null);
  const act = async <T>(action: () => Promise<ActionResult<T>>, done: string) =>
    setMessage((await run(action)) ? done : null);

  const actions: RowActions = {
    profileUrl: (handle) => `${siteUrl}/fr/pilots/${handle}`,
    setRole: (account, role) =>
      void act(
        () => updateAccount(account.id, { role }),
        `${account.email} est maintenant ${role === "admin" ? "administrateur" : "pilote"}.`,
      ),
    disable: setToDisable,
    enable: (account) =>
      void act(
        () => updateAccount(account.id, { disabled: false }),
        `${account.email} est activé : il peut de nouveau se connecter.`,
      ),
    ...copyActions(siteUrl, setMessage),
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
