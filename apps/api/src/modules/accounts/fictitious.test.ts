import type { FastifyInstance } from "fastify";
import { type AdminAccount, FICTITIOUS_PASSWORD, type FictitiousPilot } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot, uniqueEmail } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const PATH = "/v1/dev/fictitious-pilots";
const DEV = { authorization: "Bearer dev-token" };
const client = { "weems-client": "tracker/0.1.0" };
const as = (pilotId: string) => ({ authorization: `Bearer dev-token:${pilotId}`, ...client });
const SITE = { origin: "http://localhost:3001", "content-type": "application/json" };

async function create(names: string[]): Promise<FictitiousPilot[]> {
  const createdAt = "2026-05-01T08:00:00.000Z";
  const response = await app.inject({
    method: "POST",
    url: PATH,
    headers: DEV,
    payload: { pilots: names.map((name) => ({ name, createdAt })) },
  });
  expect(response.statusCode).toBe(201);
  return response.json().pilots;
}

let admin: string | null = null;

/** Every account, as the console lists them. */
async function accounts(): Promise<AdminAccount[]> {
  admin ??= await newPilot(app, uniqueEmail(), "admin");
  const response = await app.inject({
    method: "GET",
    url: "/v1/admin/accounts",
    headers: { cookie: admin },
  });
  return response.json().accounts;
}

async function fly(headers: Record<string, string>): Promise<number> {
  const flight = syntheticFlight();
  const response = await app.inject({
    method: "POST",
    url: "/v1/flights",
    headers,
    payload: flight.open,
  });
  return response.statusCode;
}

describe("fictitious accounts (development only)", () => {
  it("creates marked accounts, with an e-mail that can never be real", async () => {
    const [lea, lea2] = await create(["Léa Fontaine", "Léa Fontaine"]);
    expect(lea?.email).toMatch(/^lea-fontaine-[0-9a-f]{6}@fictif\.weems\.local$/);
    expect(lea2?.email).not.toBe(lea?.email);
  });

  it("flies as a fictitious account with the development token, never as a real one", async () => {
    const [pilot] = await create(["Marco Bianchi"]);
    expect(await fly(as(pilot?.pilotId ?? ""))).toBe(201);
    const list = await app.inject({
      method: "GET",
      url: "/v1/flights",
      headers: as(pilot?.pilotId ?? ""),
    });
    expect(list.json().flights).toHaveLength(1);

    const email = uniqueEmail();
    await newPilot(app, email);
    const real = (await accounts()).find((account) => account.email === email);
    expect(await fly(as(real?.id ?? ""))).toBe(401);
    expect(await fly(as("not-a-uuid"))).toBe(401);
  });

  it("logs in on the site with the common password", async () => {
    const [pilot] = await create(["Jonas Weber"]);
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: SITE,
      payload: JSON.stringify({ email: pilot?.email, password: FICTITIOUS_PASSWORD }),
    });
    expect(response.statusCode).toBe(200);
  });

  it("shows the badge on a public profile, and in the console", async () => {
    const [pilot] = await create(["Ana Costa"]);
    const handle = `ana-${pilot?.pilotId.slice(-6)}`;
    const saved = await app.inject({
      method: "PUT",
      url: "/v1/me/profile",
      headers: as(pilot?.pilotId ?? ""),
      payload: profile(handle),
    });
    expect(saved.statusCode).toBe(200);
    const page = await app.inject({ method: "GET", url: `/v1/pilots/${handle}` });
    expect(page.json()).toMatchObject({
      fictitious: true,
      memberSince: "2026-05-01T08:00:00.000Z",
    });

    expect((await accounts()).find((a) => a.id === pilot?.pilotId)).toMatchObject({
      fictitious: true,
      publicHandle: handle,
    });
  });

  it("deletes every fictitious account and its flights, and nothing else", async () => {
    const [pilot] = await create(["Sofia Lind"]);
    await fly(as(pilot?.pilotId ?? ""));
    const devFlight = await fly({ ...DEV, ...client });
    expect(devFlight).toBe(201);
    const before = (await app.inject({ method: "GET", url: PATH, headers: DEV })).json();
    expect(before.accounts).toBeGreaterThanOrEqual(1);
    expect(before.flights).toBeGreaterThanOrEqual(1);

    const deleted = await app.inject({ method: "DELETE", url: PATH, headers: DEV });
    expect(deleted.statusCode).toBe(200);
    expect(deleted.json()).toEqual(before);
    expect((await app.inject({ method: "GET", url: PATH, headers: DEV })).json()).toEqual({
      accounts: 0,
      publicProfiles: 0,
      flights: 0,
      busiestHandle: null,
      pilotIds: [],
    });
    expect(await fly(as(pilot?.pilotId ?? ""))).toBe(401);
    const counts = await app.inject({ method: "GET", url: "/v1/dev/flight-counts", headers: DEV });
    expect(counts.json().simulated).toBeGreaterThanOrEqual(1);
  });
});

function profile(handle: string) {
  return {
    handle,
    isPublic: true,
    country: "PT",
    homeIcao: "LFPG",
    level: "realPilot",
    vatsimId: null,
    ivaoId: null,
    instagram: null,
    facebook: null,
    simbriefId: null,
  };
}
