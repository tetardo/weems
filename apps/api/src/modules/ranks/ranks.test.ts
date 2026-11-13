import type { MyRank, PublicPilot } from "@weems/contrats";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { flyFounderFlight } from "../../testing/founder-flights.ts";
import { newTrackerPilot } from "../../testing/pilots.ts";
import { saveProfile, uniqueHandle } from "../../testing/profiles.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const get = async <T>(url: string, cookie?: string) => {
  const response = await app.inject({ method: "GET", url, headers: cookie ? { cookie } : {} });
  expect(response.statusCode, response.body).toBe(200);
  return response.json<T>();
};

describe("GET /v1/me/rank", () => {
  it("needs a pilot", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/me/rank" })).statusCode).toBe(401);
  });

  it("counts valid flights only and reaches Cadet at 5 h and 3 flights", async () => {
    const pilot = await newTrackerPilot(app);
    const empty = await get<MyRank>("/v1/me/rank", pilot.cookie);
    expect(empty).toMatchObject({ rank: "student", reachedAt: null, validFlights: 0 });

    await flyFounderFlight(app, pilot, { simulator: "replay" });
    for (let day = 0; day < 5; day += 1) await flyFounderFlight(app, pilot, { day });
    const before = await get<MyRank>("/v1/me/rank", pilot.cookie);
    expect(before).toMatchObject({ rank: "student", validFlights: 5 });
    expect(before.recentFlights.map((flight) => flight.validity)).toContain("valid");

    await flyFounderFlight(app, pilot, { day: 6 });
    const after = await get<MyRank>("/v1/me/rank", pilot.cookie);
    expect(after).toMatchObject({ rank: "cadet", validFlights: 6 });
    expect(after.validHours).toBeCloseTo((6 * 3030) / 3600);
    expect(after.totalHours).toBeCloseTo((7 * 3030) / 3600);
    expect(Date.parse(after.reachedAt ?? "")).toBeGreaterThan(
      Date.parse(after.recentFlights[1]?.openedAt ?? ""),
    );
    expect(after.next).toEqual({ rank: "flyer", hours: 20, flights: 10 });
  });
});

describe("rank on the public profile", () => {
  it("is shown, and follows a new flight without waiting for the cache", async () => {
    const pilot = await newTrackerPilot(app);
    const handle = uniqueHandle();
    await saveProfile(app, pilot, { isPublic: true, handle });
    expect((await get<PublicPilot>(`/v1/pilots/${handle}`)).rank).toEqual({
      rank: "student",
      reachedAt: null,
    });
    for (let day = 0; day < 6; day += 1) await flyFounderFlight(app, pilot, { day });
    expect((await get<PublicPilot>(`/v1/pilots/${handle}`)).rank.rank).toBe("cadet");
  });
});
