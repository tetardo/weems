import { createLocalJWKSet, type JSONWebKeySet, jwtVerify } from "jose";
import type { Auth } from "./auth.ts";

/** Signing keys are read again at most this often (and at once when a token names an unknown key). */
const KEYS_TTL_MS = 10 * 60 * 1000;

interface SigningKeys {
  set: ReturnType<typeof createLocalJWKSet>;
  ids: Set<string>;
  at: number;
}

/**
 * Who is calling: a tracker with an access token (JWT for the API), or the site
 * forwarding the pilot's session cookie. Returns the pilot id, or null when unknown.
 */
export class PilotIdentifier {
  private keys: SigningKeys | null = null;

  private readonly auth: Auth;
  private readonly apiUrl: string;
  private readonly now: () => number;

  constructor(auth: Auth, apiUrl: string, now: () => number = Date.now) {
    this.auth = auth;
    this.apiUrl = apiUrl;
    this.now = now;
  }

  async fromAccessToken(token: string): Promise<string | null> {
    try {
      const { issuer, keySet } = await this.verificationKeys(token);
      const { payload } = await jwtVerify(token, keySet, { issuer, audience: this.apiUrl });
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      return null;
    }
  }

  async fromSession(headers: Headers): Promise<string | null> {
    const session = await this.auth.api.getSession({ headers });
    return session?.user.id ?? null;
  }

  private async verificationKeys(token: string) {
    const { baseURL } = await this.auth.$context;
    const kid = keyIdOf(token);
    let keys = this.keys;
    if (!keys || this.now() - keys.at > KEYS_TTL_MS || (kid !== null && !keys.ids.has(kid))) {
      keys = await this.loadKeys();
      this.keys = keys;
    }
    return { issuer: baseURL, keySet: keys.set };
  }

  private async loadKeys() {
    const jwks = (await this.auth.api.getJwks()) as JSONWebKeySet;
    return {
      set: createLocalJWKSet(jwks),
      ids: new Set(jwks.keys.map((key) => key.kid ?? "")),
      at: this.now(),
    };
  }
}

function keyIdOf(token: string): string | null {
  try {
    const header = JSON.parse(Buffer.from(token.split(".")[0] ?? "", "base64url").toString("utf8"));
    return typeof header.kid === "string" ? header.kid : null;
  } catch {
    return null;
  }
}
