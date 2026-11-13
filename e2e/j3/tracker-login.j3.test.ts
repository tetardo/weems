import { createHash, randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { TrackerLogin } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DEV_PILOT, fillLogin } from "../site/log-in.ts";
import { type J3Stack, startJ3Stack } from "./j3-stack.ts";

/**
 * J3 (spec J3, section 1): the site behind login, and the tracker's login through the browser
 * (OAuth 2.1, PKCE, answer on 127.0.0.1), with the real site and the real API.
 */
let stack: J3Stack;

beforeAll(async () => {
  stack = await startJ3Stack();
});
afterAll(() => stack?.stop());

/** The tracker's local server: receives the browser on /callback, once. */
function loopback(): Promise<{ server: Server; port: number; query: Promise<URLSearchParams> }> {
  let received: (query: URLSearchParams) => void = () => undefined;
  const query = new Promise<URLSearchParams>((resolve) => (received = resolve));
  const server = createServer((request, response) => {
    received(new URL(request.url ?? "/", "http://127.0.0.1").searchParams);
    response.end("Weems: you can go back to the tracker.");
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({ server, port: (server.address() as AddressInfo).port, query }),
    ),
  );
}

describe("J3 site and tracker login", () => {
  it("sends a visitor without session to the login page, then back to the page asked", async () => {
    const page = await stack.browser.newPage();
    await page.goto(`${stack.siteUrl}/en/logbook/stats?period=12m`);
    expect(new URL(page.url()).pathname).toBe("/en/login");
    await fillLogin(page);
    await page.waitForURL("**/en/logbook/stats?period=12m");
    await expect(
      page.getByRole("button", { name: /Pilote de développement/ }).count(),
    ).resolves.toBe(1);
    await page.close();
  });

  it("refuses a wrong password", async () => {
    const page = await stack.browser.newPage();
    await page.goto(`${stack.siteUrl}/fr/login`);
    await fillLogin(page, { ...DEV_PILOT, password: "wrong-password" });
    await expect(page.locator("form [role=alert]").innerText()).resolves.toMatch(/incorrect/i);
    await page.close();
  });

  it("logs the tracker in through the browser and gives it tokens for the API", async () => {
    const login = TrackerLogin.parse(
      await (await fetch(`${stack.apiUrl}/v1/tracker/login`)).json(),
    );
    const { server, port, query } = await loopback();
    const redirectUri = `http://127.0.0.1:${port}${login.redirectPath}`;
    const verifier = randomBytes(32).toString("base64url");
    const authorize = new URL(login.authorizationEndpoint);
    authorize.search = new URLSearchParams({
      response_type: "code",
      client_id: login.clientId,
      redirect_uri: redirectUri,
      scope: login.scopes.join(" "),
      state: "j3",
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      resource: login.resource,
    }).toString();

    const page = await stack.browser.newPage();
    await page.goto(authorize.toString());
    expect(new URL(page.url()).pathname).toMatch(/^\/(fr|en)\/login$/); // language of the browser
    await fillLogin(page);
    const answer = await query;
    await page.waitForURL(`${redirectUri}?**`); // closing the page during the navigation would hang
    await page.close();
    server.close();
    expect(answer.get("state")).toBe("j3");

    const tokens = await fetch(login.tokenEndpoint, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: answer.get("code") ?? "",
        redirect_uri: redirectUri,
        client_id: login.clientId,
        code_verifier: verifier,
        resource: login.resource,
      }),
    });
    expect(tokens.status).toBe(200);
    const { access_token } = (await tokens.json()) as { access_token: string };
    const flights = await fetch(`${stack.apiUrl}/v1/flights`, {
      headers: { authorization: `Bearer ${access_token}` },
    });
    expect(flights.status).toBe(200);
  });
});
