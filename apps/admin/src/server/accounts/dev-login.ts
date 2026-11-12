import { DEV_PILOT_LOGIN } from "@weems/contrats";
import type { ConsoleConfig } from "../console-config.ts";
import { AdminApiError } from "./admin-api.ts";
import { signIn } from "./sign-in.ts";

/**
 * Whether the console may log in by itself as the development pilot (fiche 012): never when the
 * console runs as a production build. The API refuses this login anyway in production, where the
 * development pilot does not exist.
 */
export function devLoginAllowed(nodeEnv: string | undefined = process.env.NODE_ENV): boolean {
  return nodeEnv !== "production";
}

/**
 * Session cookie of the API for the development pilot, or null when this login is not allowed or
 * the API refuses it (production API, account missing or disabled). Other failures (API stopped)
 * are thrown, as for a manual login.
 */
export async function devLogin(
  config: ConsoleConfig,
  login = signIn,
  nodeEnv?: string,
): Promise<string | null> {
  if (!devLoginAllowed(nodeEnv)) return null;
  try {
    return await login(config, DEV_PILOT_LOGIN.email, DEV_PILOT_LOGIN.password);
  } catch (error) {
    if (error instanceof AdminApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}
