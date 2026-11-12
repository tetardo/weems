import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot, newTrackerPilot } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { syntheticTrack } from "../../testing/synthetic-track.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

describe("GET /v1/me/logbook/summary", () => {
  it("needs a pilot", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/me/logbook/summary" });
    expect(response.statusCode).toBe(401);
  });

  it("answers an empty summary to a pilot without flights", async () => {
    const cookie = await newPilot(app);
    const response = await app.inject({
      method: "GET",
      url: "/v1/me/logbook/summary",
      headers: { cookie },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ lastFlight: null, recentFlights: [], flyingDays: [] });
  });
});

/** A closed flight of a new pilot, with a trajectory over 250 kt below 10,000 ft. */
async function flightWithTrack() {
  const { cookie, tracker } = await newTrackerPilot(app);
  const flight = syntheticFlight();
  const id = flight.open.flightId;
  const send = (url: string, payload: unknown) =>
    app.inject({ method: "POST", url, headers: tracker, payload: payload as object });
  await send("/v1/flights", flight.open);
  await send(`/v1/flights/${id}/close`, flight.close);
  const points = syntheticTrack(180).map((p) => ({ ...p, ias: p.onGround ? 10 : 280 }));
  await send(`/v1/flights/${id}/track`, { points });
  return { cookie, id };
}

const bandsOf = (cookie: string, id: string) =>
  app.inject({ method: "GET", url: `/v1/me/logbook/flights/${id}/bands`, headers: { cookie } });

describe("GET /v1/me/logbook/entries", () => {
  it("needs a pilot", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/me/logbook/entries" });
    expect(response.statusCode).toBe(401);
  });

  it("lists the pilot's closed flights with their verdict", async () => {
    const { cookie, id } = await flightWithTrack();
    const response = await app.inject({
      method: "GET",
      url: "/v1/me/logbook/entries",
      headers: { cookie },
    });
    expect(response.json().entries).toEqual([
      expect.objectContaining({ flight: expect.objectContaining({ flightId: id }) }),
    ]);
  });
});

describe("GET /v1/me/logbook/flights/{id}/bands", () => {
  it("gives the bands, without the marks on Pilot Free", async () => {
    const { cookie, id } = await flightWithTrack();
    const response = await bandsOf(cookie, id);
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ marks: null, rows: expect.arrayContaining(["speed"]) });
    expect(response.json().minutes).toHaveLength(3);
  });

  it("adds the marks on Pilot Pro", async () => {
    const { cookie, id } = await flightWithTrack();
    await app.inject({
      method: "PUT",
      url: "/v1/dev/me/plan",
      headers: { cookie },
      payload: { plan: "pilot_pro" },
    });
    const marks = (await bandsOf(cookie, id)).json().marks;
    expect(marks).toContainEqual(expect.objectContaining({ row: "speed", reason: "speed250" }));
  });

  it("does not show another pilot's flight", async () => {
    const { id } = await flightWithTrack();
    expect((await bandsOf(await newPilot(app), id)).statusCode).toBe(404);
  });
});
