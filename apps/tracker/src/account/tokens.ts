import { z } from "zod";

/** The pilot's tokens, as the tracker keeps them (access 1 h, refresh 90 days, spec J3). */
export const Tokens = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  /** Epoch ms after which the access token is refused. */
  expiresAt: z.number(),
});
export type Tokens = z.infer<typeof Tokens>;

/** Token endpoint answer (RFC 6749, section 5.1). */
const TokenAnswer = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().positive(),
});

/** The refresh token is no longer valid: the pilot has to log in again. */
export class LoginRequired extends Error {
  constructor() {
    super("login required");
  }
}

/**
 * POST to the token endpoint (code exchange or refresh).
 * 400/401 → LoginRequired; network error or 5xx → thrown as is, the caller retries later.
 */
export async function requestTokens(
  tokenEndpoint: string,
  form: Record<string, string>,
  now: () => number,
): Promise<Tokens> {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 400 || response.status === 401) throw new LoginRequired();
  if (!response.ok) throw new Error(`token endpoint: HTTP ${response.status}`);
  const answer = TokenAnswer.parse(await response.json());
  return {
    accessToken: answer.access_token,
    refreshToken: answer.refresh_token,
    expiresAt: now() + answer.expires_in * 1000,
  };
}
