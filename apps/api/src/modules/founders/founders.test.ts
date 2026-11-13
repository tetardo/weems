import type {
  AdminAccountList,
  AdminFounders,
  MyCodes,
  MyFounder,
  MyPlan,
  PublicFounders,
  PublicPilot,
} from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectTestDatabase } from "../../testing/database.ts";
import { flyFounderFlight } from "../../testing/founder-flights.ts";
import { newPilot, newTrackerPilot } from "../../testing/pilots.ts";
import { type Pilot, saveProfile, uniqueHandle } from "../../testing/profiles.ts";
import { startTestApp } from "../../testing/test-app.ts";
import { FoundersRepository } from "./repository.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let admin: string;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  admin = await newPilot(app, undefined, "admin");
});
afterAll(() => stop());

const get = async <T>(url: string, cookie?: string) => {
  const response = await app.inject({ method: "GET", url, headers: cookie ? { cookie } : {} });
  expect(response.statusCode, response.body).toBe(200);
  return response.json<T>();
};
const post = (url: string, cookie: string) =>
  app.inject({ method: "POST", url, headers: { cookie } });

/** A pilot with three valid flights on two days: a founder. */
async function newFounder(): Promise<{ pilot: Pilot; place: NonNullable<MyFounder["place"]> }> {
  const pilot = await newTrackerPilot(app);
  for (const day of [0, 0, 1]) await flyFounderFlight(app, pilot, { day });
  const { place } = await get<MyFounder>("/v1/me/founder", pilot.cookie);
  if (!place) throw new Error("no founder place");
  return { pilot, place };
}

describe("GET /v1/me/founder", () => {
  it("needs a pilot", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/me/founder" })).statusCode).toBe(401);
  });

  it("shows the progress, flight by flight, until the third valid flight on a second day", async () => {
    const pilot = await newTrackerPilot(app);
    await flyFounderFlight(app, pilot, { day: 0 });
    await flyFounderFlight(app, pilot, { day: 0, simulator: "replay" });
    await flyFounderFlight(app, pilot, { day: 0 });
    const before = await get<MyFounder>("/v1/me/founder", pilot.cookie);
    expect(before).toMatchObject({ place: null, eligible: true, validFlights: 2, validDays: 1 });
    expect(before.flights.map((flight) => flight.check).sort()).toEqual([
      "simulated",
      "valid",
      "valid",
    ]);
    expect(before.flights[0]).toMatchObject({ distanceNm: expect.any(Number), airborneS: 3030 });

    await flyFounderFlight(app, pilot, { day: 1 });
    const after = await get<MyFounder>("/v1/me/founder", pilot.cookie);
    expect(after.place).toMatchObject({ status: "pending", number: expect.any(Number) });
  });

  it("never gives a place to an administrator", async () => {
    expect(await get<MyFounder>("/v1/me/founder", admin)).toMatchObject({
      eligible: false,
      place: null,
    });
  });
});

describe("a new founder", () => {
  it("gets Pilot Pro for a year and three referral codes, at the end of the flight", async () => {
    const { pilot, place } = await newFounder();
    const plan = await get<MyPlan>("/v1/me/plan", pilot.cookie);
    expect(plan).toMatchObject({ plan: "pilot_pro", offered: { source: "founder" } });
    const days = (Date.parse(plan.offered?.until ?? "") - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(364);
    expect(days).toBeLessThan(367);
    const { referral } = await get<MyCodes>("/v1/me/codes", pilot.cookie);
    expect(referral).toHaveLength(3);
    expect(referral[0]).toMatchObject({ months: 3, usedAt: null });
    // The console's page Comptes shows the plan given.
    const { founders } = await get<AdminFounders>("/v1/admin/founders", admin);
    const pilotId = founders.find((founder) => founder.number === place.number)?.pilotId;
    const { accounts } = await get<AdminAccountList>("/v1/admin/accounts", admin);
    expect(accounts.find((account) => account.id === pilotId)?.plan).toBe("pilot_pro");
    // Flying more never gives a second place.
    await flyFounderFlight(app, pilot, { day: 2 });
    expect((await get<MyFounder>("/v1/me/founder", pilot.cookie)).place?.number).toBe(place.number);
  });

  it("can be confirmed early, then shows on the public state of the offer and profile", async () => {
    const { pilot, place } = await newFounder();
    const handle = uniqueHandle();
    await saveProfile(app, pilot, { isPublic: true, handle });
    expect((await get<PublicPilot>(`/v1/pilots/${handle}`)).founderNumber).toBe(null);
    expect((await post(`/v1/admin/founders/${place.number}/confirm`, admin)).statusCode).toBe(204);
    expect((await get<PublicPilot>(`/v1/pilots/${handle}`)).founderNumber).toBe(place.number);
    const offer = await get<PublicFounders>("/v1/founders");
    expect(offer.places).toBe(500);
    expect(offer.placesLeft).toBe(500 - offer.taken);
    expect(offer.latest.map((founder) => founder.number)).toContain(place.number);
  });

  it("can be refused: Pilot Pro and unused codes taken back, number never given again", async () => {
    const { pilot, place } = await newFounder();
    expect((await post(`/v1/admin/founders/${place.number}/refuse`, admin)).statusCode).toBe(204);
    expect((await get<MyPlan>("/v1/me/plan", pilot.cookie)).offered).toBe(null);
    const { referral } = await get<MyCodes>("/v1/me/codes", pilot.cookie);
    expect(referral.every((code) => Date.parse(code.expiresAt) <= Date.now())).toBe(true);
    expect((await get<MyFounder>("/v1/me/founder", pilot.cookie)).place?.status).toBe("refused");
    expect((await post(`/v1/admin/founders/${place.number}/confirm`, admin)).statusCode).toBe(409);
    const list = await get<AdminFounders>("/v1/admin/founders", admin);
    expect(list.founders.find((f) => f.number === place.number)?.status).toBe("refused");
  });
});

describe("admin routes", () => {
  it("are for administrators only", async () => {
    const pilot = await newPilot(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/admin/founders",
      headers: { cookie: pilot },
    });
    expect(response.statusCode).toBe(403);
    expect((await post("/v1/admin/founders/999999/refuse", admin)).statusCode).toBe(404);
  });
});

describe("places", () => {
  it("are never given beyond the limit", async () => {
    const database = connectTestDatabase();
    try {
      const repository = new FoundersRepository(database.db);
      const pilot = await newTrackerPilot(app);
      const { place } = await get<MyFounder>("/v1/me/founder", pilot.cookie);
      expect(place).toBe(null);
      const taken = await repository.taken();
      const me = (
        await app.inject({ method: "GET", url: "/v1/admin/me", headers: { cookie: admin } })
      ).json<{ id: string }>();
      expect(await repository.claim(me.id, taken, new Date())).toBe(null);
    } finally {
      await database.close();
    }
  });
});
