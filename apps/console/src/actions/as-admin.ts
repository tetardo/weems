import { AdminApi, AdminApiError } from "../server/accounts/admin-api.ts";
import { withAdminSession } from "../server/accounts/admin-session.ts";
import { config } from "../server/console.ts";

const NOT_ADMIN =
  "Ce compte n'est pas administrateur : pnpm --filter @weems/api make-admin <e-mail>, puis recharger.";

/** Calls /v1/admin/* as the administrator; a 403 says how to become one. */
export async function asAdmin<T>(call: (api: AdminApi) => Promise<T>): Promise<T> {
  try {
    return await withAdminSession((session) => call(new AdminApi(config(), session)));
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403)
      throw new Error(NOT_ADMIN, { cause: error });
    throw error;
  }
}
