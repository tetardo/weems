import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  invite,
  newPilot,
  signIn,
  signUp,
  trackerLogin,
  uniqueEmail,
  PASSWORD,
} from "../../testing/pilots.ts";
import { connectTestDatabase } from "../../testing/database.ts";
import { startTestApp } from "../../testing/test-app.ts";
import { invitations } from "../../db/auth-schema.ts";
import { eq } from "drizzle-orm";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, uniqueEmail(), "admin");
});
afterAll(() => stop());

const get = (url: string, cookie?: string) =>
  app.inject({ method: "GET", url, headers: cookie ? { cookie } : {} });
const send = (method: "POST" | "PATCH" | "DELETE", url: string, payload?: object) =>
  app.inject({ method, url, headers: { cookie: admin }, ...(payload ? { payload } : {}) });

async function accountOf(email: string) {
  const list = (await get("/v1/admin/accounts", admin)).json();
  return list.accounts.find((account: { email: string }) => account.email === email);
}

describe("admin guard", () => {
  it("answers 401 without a session and 403 to a pilot", async () => {
    expect((await get("/v1/admin/accounts")).statusCode).toBe(401);
    expect((await get("/v1/admin/accounts", await newPilot(app))).statusCode).toBe(403);
  });

  it("refuses the development token: the console logs in with a session", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/me",
      headers: { authorization: "Bearer dev-token" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("knows the administrator logged in", async () => {
    const me = await get("/v1/admin/me", admin);
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ name: "Test pilot", email: expect.any(String) });
  });
});

describe("invitations", () => {
  it("invites, lists, renews (old code dead) and cancels", async () => {
    const email = uniqueEmail();
    const created = await send("POST", "/v1/admin/invitations", { email });
    expect(created.statusCode).toBe(201);
    const { code, role, expiresAt } = created.json();
    expect(role).toBe("pilot");
    expect(Date.parse(expiresAt) - Date.now()).toBeGreaterThan(13 * 86_400_000);
    expect((await send("POST", "/v1/admin/invitations", { email })).statusCode).toBe(409);

    const renewed = await send("POST", `/v1/admin/invitations/${code}/renew`);
    expect(renewed.statusCode).toBe(200);
    const newCode = renewed.json().code;
    expect(newCode).not.toBe(code);
    const listed = (await get("/v1/admin/accounts", admin)).json().invitations;
    expect(listed.map((i: { code: string }) => i.code)).toContain(newCode);
    expect(listed.map((i: { code: string }) => i.code)).not.toContain(code);

    expect((await send("DELETE", `/v1/admin/invitations/${newCode}`)).statusCode).toBe(204);
    expect((await send("DELETE", `/v1/admin/invitations/${newCode}`)).statusCode).toBe(404);
    const body = { email, password: PASSWORD, name: "Late", inviteCode: newCode };
    expect((await signUp(app, body)).statusCode).toBe(403);
  });

  it("refuses an expired invitation at sign-up", async () => {
    const email = uniqueEmail();
    const inviteCode = await invite(email);
    const database = connectTestDatabase();
    try {
      await database.db
        .update(invitations)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where(eq(invitations.code, inviteCode));
    } finally {
      await database.close();
    }
    const response = await signUp(app, { email, password: PASSWORD, name: "Late", inviteCode });
    expect(response.statusCode).toBe(403);
  });

  it("gives the administrator role of the invitation at sign-up", async () => {
    const email = uniqueEmail();
    const cookie = await newPilot(app, email, "admin");
    expect((await get("/v1/admin/me", cookie)).statusCode).toBe(200);
    expect((await accountOf(email)).role).toBe("admin");
  });
});

describe("account changes", () => {
  it("changes a role, both ways", async () => {
    const email = uniqueEmail();
    await newPilot(app, email);
    const { id } = await accountOf(email);
    const promoted = await send("PATCH", `/v1/admin/accounts/${id}`, { role: "admin" });
    expect(promoted.json().role).toBe("admin");
    const back = await send("PATCH", `/v1/admin/accounts/${id}`, { role: "pilot" });
    expect(back.json().role).toBe("pilot");
  });

  it("never lets an administrator change their own account", async () => {
    const { id } = (await get("/v1/admin/me", admin)).json();
    const response = await send("PATCH", `/v1/admin/accounts/${id}`, { disabled: true });
    expect(response.statusCode).toBe(403);
  });

  it("answers 404 for an unknown account and 400 for two changes at once", async () => {
    const unknown = "01970000-0000-7000-8000-00000000dead";
    expect(
      (await send("PATCH", `/v1/admin/accounts/${unknown}`, { disabled: true })).statusCode,
    ).toBe(404);
    const { id } = await accountOf((await get("/v1/admin/me", admin)).json().email);
    const both = await send("PATCH", `/v1/admin/accounts/${id}`, { role: "admin", disabled: true });
    expect(both.statusCode).toBe(400);
  });

  it("disables: session, login and tracker tokens refused; reactivates: login works again", async () => {
    const email = uniqueEmail();
    const cookie = await newPilot(app, email);
    const tokens = (await trackerLogin(app, cookie)).json();
    const bearer = { authorization: `Bearer ${tokens.access_token}` };
    const { id } = await accountOf(email);

    const disabled = await send("PATCH", `/v1/admin/accounts/${id}`, { disabled: true });
    expect(disabled.json().disabledAt).toEqual(expect.any(String));
    expect((await get("/v1/flights", cookie)).statusCode).toBe(401);
    const withToken = await app.inject({ method: "GET", url: "/v1/flights", headers: bearer });
    expect(withToken.statusCode).toBe(401);
    expect((await signIn(app, email)).statusCode).toBe(403);

    await send("PATCH", `/v1/admin/accounts/${id}`, { disabled: false });
    expect((await signIn(app, email)).statusCode).toBe(200);
  });
});
