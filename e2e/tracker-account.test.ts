import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp } from "../apps/api/src/testing/test-app.ts";
import { invite, uniqueEmail } from "../apps/api/src/testing/pilots.ts";
import { Account } from "../apps/tracker/src/account/account.ts";
import { memoryStore } from "../apps/tracker/src/account/token-store.ts";
import { httpApiClient } from "../apps/tracker/src/sender/api-client.ts";

/**
 * J3: the tracker's account against the real API. The browser is played by plain HTTP:
 * the pilot is already logged in on the site (session cookie), so authorizing sends straight
 * back to the tracker's local server. Here the API also plays the site (same address).
 */
let api: Awaited<ReturnType<typeof startTestApp>>;
let apiUrl: string;

beforeAll(async () => {
  const port = 5_000 + Math.floor(Math.random() * 900);
  apiUrl = `http://127.0.0.1:${port}`;
  api = await startTestApp({ WEEMS_SITE_URL: apiUrl, WEEMS_API_URL: apiUrl });
  await api.app.listen({ port, host: "127.0.0.1" });
});
afterAll(() => api.stop());

/** A new invited pilot logged in on the "site": returns the session cookie. */
async function siteSession(): Promise<string> {
  const email = uniqueEmail();
  const response = await fetch(`${apiUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: apiUrl },
    body: JSON.stringify({
      email,
      password: "correct horse battery staple",
      name: "Tracker pilot",
      inviteCode: await invite(email),
    }),
  });
  expect(response.status).toBe(200);
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(";")[0])
    .join("; ");
}

/** The pilot's browser: follows the authorization to the tracker's 127.0.0.1 address. */
function browserOf(cookie: string) {
  return async (url: string) => {
    const authorize = await fetch(url, { headers: { cookie }, redirect: "manual" });
    // A redirect for a real browser; fetch() gets the same address in JSON.
    const location =
      authorize.headers.get("location") ?? ((await authorize.json()) as { url?: string }).url;
    if (!location) throw new Error(`no redirect: ${authorize.status}`);
    await fetch(location);
  };
}

describe("tracker account (OAuth 2.1, PKCE, loopback)", () => {
  it("logs in through the browser, then sends with the pilot's token", async () => {
    const account = new Account(apiUrl, memoryStore());
    expect(await account.accessToken()).toBeNull();
    await account.logIn(browserOf(await siteSession()));
    expect(account.loggedIn).toBe(true);

    const client = httpApiClient({
      baseUrl: apiUrl,
      token: () => account.accessToken(),
      trackerVersion: "0.1.0",
    });
    const answer = await client.post("/v1/flights", { not: "a flight" });
    expect(answer.status).toBe(400); // authenticated: refused for its content, not 401
  });

  it("renews the access token before it ends, keeping the pilot logged in", async () => {
    let now = Date.now();
    const store = memoryStore();
    const account = new Account(apiUrl, store, () => now);
    await account.logIn(browserOf(await siteSession()));
    const first = await account.accessToken();

    now += 59 * 60_000; // one minute before the end of the hour
    const renewed = await account.accessToken();
    expect(renewed).not.toBe(first);
    expect(store.load()?.accessToken).toBe(renewed);
  });

  it("logs the pilot out when the refresh token is refused", async () => {
    let now = Date.now();
    const store = memoryStore();
    const account = new Account(apiUrl, store, () => now);
    await account.logIn(browserOf(await siteSession()));
    const kept = store.load();
    if (!kept) throw new Error("no tokens");
    store.save({ ...kept, refreshToken: "revoked" });

    now += 2 * 3_600_000;
    const reloaded = new Account(apiUrl, store, () => now);
    expect(await reloaded.accessToken()).toBeNull();
    expect(reloaded.loggedIn).toBe(false);
    expect(store.load()).toBeNull();
  });

  it("answers 401 without calling the API when nobody is logged in", async () => {
    const client = httpApiClient({
      baseUrl: "http://127.0.0.1:9",
      token: async () => null,
      trackerVersion: "0.1.0",
    });
    expect((await client.post("/v1/flights", {})).status).toBe(401);
  });
});
