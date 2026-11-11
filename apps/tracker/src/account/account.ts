import { type BrowserLoginOptions, fetchLoginSettings, loginInBrowser } from "./browser-login.ts";
import type { TokenStore } from "./token-store.ts";
import { LoginRequired, requestTokens, type Tokens } from "./tokens.ts";

/** An access token this close to its end is renewed before use. */
const RENEW_BEFORE_MS = 60_000;

/**
 * The pilot's account in the tracker: logs in through the browser, keeps the tokens,
 * renews the access token before it ends. Without a valid refresh token, the pilot is logged out.
 */
export class Account {
  private readonly apiUrl: string;
  private readonly store: TokenStore;
  private readonly now: () => number;
  private tokens: Tokens | null;
  private renewing: Promise<string | null> | null = null;

  constructor(apiUrl: string, store: TokenStore, now: () => number = Date.now) {
    this.apiUrl = apiUrl;
    this.store = store;
    this.now = now;
    this.tokens = store.load();
  }

  get loggedIn(): boolean {
    return this.tokens !== null;
  }

  async logIn(openBrowser: BrowserLoginOptions["openBrowser"]): Promise<void> {
    this.keep(await loginInBrowser({ apiUrl: this.apiUrl, openBrowser, now: this.now }));
  }

  /** Forgets the tokens on this PC (the session ends by itself on the API). */
  logOut(): void {
    this.tokens = null;
    this.store.clear();
  }

  /**
   * A valid access token, renewed when needed; null when the pilot must log in again.
   * Network errors are thrown: the caller retries later, the pilot stays logged in.
   */
  async accessToken(): Promise<string | null> {
    if (!this.tokens) return null;
    if (this.tokens.expiresAt - this.now() > RENEW_BEFORE_MS) return this.tokens.accessToken;
    this.renewing ??= this.renew(this.tokens.refreshToken).finally(() => (this.renewing = null));
    return this.renewing;
  }

  private async renew(refreshToken: string): Promise<string | null> {
    const login = await fetchLoginSettings(this.apiUrl);
    try {
      const tokens = await requestTokens(
        login.tokenEndpoint,
        {
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: login.clientId,
          resource: login.resource,
        },
        this.now,
      );
      this.keep(tokens);
      return tokens.accessToken;
    } catch (error) {
      if (!(error instanceof LoginRequired)) throw error;
      this.logOut();
      return null;
    }
  }

  private keep(tokens: Tokens): void {
    this.tokens = tokens;
    this.store.save(tokens);
  }
}
