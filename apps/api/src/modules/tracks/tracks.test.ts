import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { syntheticTrack } from "../../testing/synthetic-track.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

async function closedFlight() {
  const flight = syntheticFlight();
  const id = flight.open.flightId;
  const headers = TRACKER_HEADERS;
  await app.inject({ method: "POST", url: "/v1/flights", payload: flight.open, headers });
  await app.inject({
    method: "POST",
    url: `/v1/flights/${id}/events`,
    payload: { events: flight.events },
    headers,
  });
  await app.inject({
    method: "POST",
    url: `/v1/flights/${id}/close`,
    payload: flight.close,
    headers,
  });
  return id;
}
const put = (id: string, points: unknown) =>
  app.inject({
    method: "PUT",
    url: `/v1/flights/${id}/track`,
    payload: { points },
    headers: TRACKER_HEADERS,
  });
const get = (id: string) =>
  app.inject({ method: "GET", url: `/v1/flights/${id}/track`, headers: TRACKER_HEADERS });

describe("trajectory (spec J2)", () => {
  it("stores a 2-hour trajectory and reads it back simplified, with phases", async () => {
    const id = await closedFlight();
    const track = syntheticTrack(7_200);
    expect((await put(id, track)).statusCode).toBe(201);

    const view = (await get(id)).json();
    expect(view.recordedPoints).toBe(7_200);
    expect(view.points.length).toBeLessThanOrEqual(500);
    expect(view.points[0]).toEqual({ ...track[0], phase: null });
    const phases = new Set(view.points.map((p: { phase: string }) => p.phase));
    expect([...phases]).toEqual([null, "PUSHBACK", "TAXI_OUT", "TAKEOFF", "CLIMB", "CRUISE"]);
  });

  it("answers 200 to an identical re-send and 409 to a different one", async () => {
    const id = await closedFlight();
    const track = syntheticTrack(600);
    await put(id, track);
    expect((await put(id, track)).json()).toEqual({ result: "alreadyReceived" });
    expect((await put(id, track.slice(1))).statusCode).toBe(409);
  });

  it("answers 404 for a flight without trajectory, or an unknown flight", async () => {
    expect((await get(await closedFlight())).statusCode).toBe(404);
    expect((await put(syntheticFlight().open.flightId, syntheticTrack(10))).statusCode).toBe(404);
  });
});
