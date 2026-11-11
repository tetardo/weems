import type { Config } from "../../config.ts";
import { TRACKER_SCOPES } from "./auth.ts";
import type { AccountsRepository } from "./repository.ts";

/**
 * The tracker's OAuth client: public (no secret, PKCE), native, loopback redirect
 * whose port may vary (RFC 8252 §7.3), no consent screen (it is Weems' own application).
 */
export const TRACKER_CLIENT_ID = "weems-tracker";
export const TRACKER_REDIRECT_URI = "http://127.0.0.1/callback";

/** Creates the client on first start (idempotent). */
export async function ensureTrackerClient(
  repository: AccountsRepository,
  config: Config,
): Promise<void> {
  await repository.ensureFirstPartyClient({
    clientId: TRACKER_CLIENT_ID,
    name: "Weems Tracker",
    redirectUris: [TRACKER_REDIRECT_URI],
    scopes: [...TRACKER_SCOPES],
    resource: config.apiUrl,
  });
}
