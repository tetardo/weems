import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

async function openedFlight(): Promise<string> {
  const flight = syntheticFlight();
  await app.inject({
    method: "POST",
    url: "/v1/flights",
    payload: flight.open,
    headers: TRACKER_HEADERS,
  });
  return flight.open.flightId;
}
const url = (id: string) => `/v1/flights/${id}/review`;
const put = (
  id: string,
  payload: Record<string, unknown>,
  headers: Record<string, string> = TRACKER_HEADERS,
) => app.inject({ method: "PUT", url: url(id), payload, headers });
const get = (id: string, headers: Record<string, string> = TRACKER_HEADERS) =>
  app.inject({ method: "GET", url: url(id), headers });

describe("review of a flight's phases (spec J3)", () => {
  it("saves the pilot's review, reads it back, and lets a new one replace it", async () => {
    const id = await openedFlight();
    expect((await get(id)).statusCode).toBe(404);

    const saved = await put(id, { phases: "wrong", note: "Montée vue comme croisière" });
    expect(saved.statusCode).toBe(200);
    expect((await get(id)).json()).toMatchObject({
      phases: "wrong",
      note: "Montée vue comme croisière",
    });

    await put(id, { phases: "correct" });
    expect((await get(id)).json()).toMatchObject({ phases: "correct", note: "" });
  });

  it("answers the same to an identical re-send", async () => {
    const id = await openedFlight();
    await put(id, { phases: "correct" });
    expect((await put(id, { phases: "correct" })).statusCode).toBe(200);
    expect((await get(id)).json()).toMatchObject({ phases: "correct" });
  });

  it("refuses a bad value and hides another pilot's flight", async () => {
    const id = await openedFlight();
    expect((await put(id, { phases: "maybe" })).statusCode).toBe(400);
    expect((await put(id, { phases: "correct", note: "x".repeat(1001) })).statusCode).toBe(400);

    const other = { cookie: await newPilot(app) };
    expect((await put(id, { phases: "correct" }, other)).statusCode).toBe(404);
    expect((await get(id, other)).statusCode).toBe(404);
  });
});
