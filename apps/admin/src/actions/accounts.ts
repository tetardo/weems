"use server";

import {
  AccountUpdate,
  type AdminAccountList,
  type AdminMe,
  InvitationRequest,
} from "@weems/contrats";
import { cookies } from "next/headers";
import { AdminApi, AdminApiError } from "../server/accounts/admin-api.ts";
import { signIn } from "../server/accounts/sign-in.ts";
import { config } from "../server/console.ts";
import { type ActionResult, attempt } from "./result.ts";

/** The console's own cookie, holding the API session of the administrator. */
const SESSION_COOKIE = "weems-admin-session";

async function api(): Promise<AdminApi> {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) throw new AdminApiError(401, "Connectez-vous.");
  return new AdminApi(config(), cookie);
}

export type AccountsPage =
  | { status: "login"; reason: string | null }
  | { status: "ready"; me: AdminMe; list: AdminAccountList; siteUrl: string };

/** The page Comptes: the list, or the login form when there is no administrator session. */
export async function readAccounts(): Promise<ActionResult<AccountsPage>> {
  return attempt(async () => {
    try {
      const admin = await api();
      const [me, list] = await Promise.all([admin.me(), admin.list()]);
      return { status: "ready", me, list, siteUrl: config().siteUrl };
    } catch (error) {
      if (!(error instanceof AdminApiError) || (error.status !== 401 && error.status !== 403)) {
        throw error;
      }
      const reason = error.status === 403 ? "Ce compte n'est pas administrateur." : null;
      return { status: "login", reason };
    }
  });
}

export async function logIn(email: string, password: string) {
  return attempt(async () => {
    const session = await signIn(config(), email, password);
    await new AdminApi(config(), session).me().catch((error: unknown) => {
      if (error instanceof AdminApiError && error.status === 403) {
        throw new AdminApiError(403, "Ce compte n'est pas administrateur.");
      }
      throw error;
    });
    (await cookies()).set(SESSION_COOKIE, session, {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
    });
    return null;
  });
}

export async function logOut() {
  return attempt(async () => {
    (await cookies()).delete(SESSION_COOKIE);
    return null;
  });
}

export async function invite(request: unknown) {
  return attempt(async () => (await api()).invite(InvitationRequest.parse(request)));
}

export async function renewInvitation(code: string) {
  return attempt(async () => (await api()).renew(code));
}

export async function cancelInvitation(code: string) {
  return attempt(async () => {
    await (await api()).cancel(code);
    return null;
  });
}

export async function updateAccount(id: string, update: unknown) {
  return attempt(async () => (await api()).update(id, AccountUpdate.parse(update)));
}
