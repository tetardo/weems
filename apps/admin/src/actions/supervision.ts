"use server";

import type { AdminSupervision } from "@weems/contrats";
import { AdminApi, AdminApiError } from "../server/accounts/admin-api.ts";
import { withAdminSession } from "../server/accounts/admin-session.ts";
import { config } from "../server/console.ts";
import { type ActionResult, attempt } from "./result.ts";

const NOT_ADMIN =
  "Ce compte n'est pas administrateur : pnpm --filter @weems/api make-admin <e-mail>, puis recharger.";

/** The page Supervision: one read of the API as the administrator, every 10 s. */
export async function readSupervision(): Promise<ActionResult<AdminSupervision>> {
  return attempt(async () => {
    try {
      return await withAdminSession((session) => new AdminApi(config(), session).supervision());
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 403)
        throw new Error(NOT_ADMIN, { cause: error });
      throw error;
    }
  });
}
