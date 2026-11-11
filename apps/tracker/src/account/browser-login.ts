import { TrackerLogin } from "@weems/contrats";
import { startLoopback } from "./loopback-server.ts";
import { pkcePair, randomState } from "./pkce.ts";
import { requestTokens, type Tokens } from "./tokens.ts";

export interface BrowserLoginOptions {
  apiUrl: string;
  /** Opens the address in the pilot's browser (Electron: shell.openExternal). */
  openBrowser: (url: string) => Promise<void> | void;
  now?: () => number;
  /** The pilot has this long to log in. */
  timeoutMs?: number;
}

/** Asks the API how to log in (GET /v1/tracker/login): nothing is hard-coded in the tracker. */
export async function fetchLoginSettings(apiUrl: string): Promise<TrackerLogin> {
  const response = await fetch(new URL("/v1/tracker/login", apiUrl), {
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`login settings: HTTP ${response.status}`);
  return TrackerLogin.parse(await response.json());
}

/**
 * Logs the pilot in through the browser (spec J3, OAuth 2.1 with PKCE):
 * the tracker never sees the password. Returns the tokens.
 */
export async function loginInBrowser(options: BrowserLoginOptions): Promise<Tokens> {
  const now = options.now ?? Date.now;
  const login = await fetchLoginSettings(options.apiUrl);
  const loopback = await startLoopback(login.redirectPath, options.timeoutMs ?? 10 * 60_000);
  try {
    const { verifier, challenge } = pkcePair();
    const state = randomState();
    const authorize = new URL(login.authorizationEndpoint);
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: login.clientId,
      redirect_uri: loopback.redirectUri,
      scope: login.scopes.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      resource: login.resource,
    }).toString();
    await options.openBrowser(authorize.toString());

    const answer = await loopback.answer;
    if (answer.state !== state) throw new Error("login answer with a wrong state");
    if (!answer.code) throw new Error(`login refused: ${answer.error ?? "no code"}`);
    return await requestTokens(
      login.tokenEndpoint,
      {
        grant_type: "authorization_code",
        code: answer.code,
        redirect_uri: loopback.redirectUri,
        client_id: login.clientId,
        code_verifier: verifier,
        resource: login.resource,
      },
      now,
    );
  } finally {
    loopback.close();
  }
}
