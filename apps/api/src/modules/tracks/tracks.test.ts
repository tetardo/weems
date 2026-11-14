import { gzipSync } from "node:zlib";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { syntheticTrack } from "../../testing/synthetic-track.ts";
import { connectTestDatabase } from "../../testing/database.ts";
import { PostgresTrackStore } from "./repository.ts";

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
const upload = (id: string, points: unknown) =>
  app.inject({
    method: "POST",
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
    expect((await upload(id, track)).statusCode).toBe(201);

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
    await upload(id, track);
    expect((await upload(id, track)).json()).toEqual({ result: "alreadyReceived" });
    expect((await upload(id, track.slice(1))).statusCode).toBe(409);
  });

  it("answers 404 for a flight without trajectory, or an unknown flight", async () => {
    expect((await get(await closedFlight())).statusCode).toBe(404);
    expect((await upload(syntheticFlight().open.flightId, syntheticTrack(10))).statusCode).toBe(
      404,
    );
  });
});

describe("whole samples in the recording (fiche 021)", () => {
  const rest = {
    pitch: 2.5,
    tas: 460,
    wind: { dir: 270, speed: 35 },
    engines: [{ running: true, n1: 82 }],
    surface: null,
  };
  const fullTrack = (count: number) => syntheticTrack(count).map((p) => ({ ...p, ...rest }));
  const gzipUpload = (id: string, body: Buffer, encoding = "gzip") =>
    app.inject({
      method: "POST",
      url: `/v1/flights/${id}/track`,
      payload: body,
      headers: {
        ...TRACKER_HEADERS,
        "content-type": "application/json",
        "content-encoding": encoding,
      },
    });

  it("keeps the rest of each sample in the recording, not in the simplified points", async () => {
    const id = await closedFlight();
    expect((await upload(id, fullTrack(600))).statusCode).toBe(201);
    const view = (await get(id)).json();
    expect(view.points[0]).not.toHaveProperty("pitch");
    const handle = connectTestDatabase();
    const recorded = await new PostgresTrackStore(handle.db).recorded(id);
    await handle.close();
    expect(recorded?.[0]).toMatchObject(rest);
  });

  it("accepts a gzip-compressed trajectory", async () => {
    const id = await closedFlight();
    const body = gzipSync(JSON.stringify({ points: fullTrack(600) }));
    expect((await gzipUpload(id, body)).statusCode).toBe(201);
    expect((await get(id)).json().recordedPoints).toBe(600);
  });

  it("answers 400 to a broken archive and 415 to another encoding", async () => {
    const id = await closedFlight();
    expect((await gzipUpload(id, Buffer.from("not gzip"))).statusCode).toBe(400);
    const body = gzipSync(JSON.stringify({ points: fullTrack(10) }));
    expect((await gzipUpload(id, body, "br")).statusCode).toBe(415);
  });
});
