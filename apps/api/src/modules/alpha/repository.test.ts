import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { connectTestDatabase } from "../../testing/database.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { syntheticTrack } from "../../testing/synthetic-track.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";
import { AlphaRepository } from "./repository.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
const database = connectTestDatabase();

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(async () => {
  await stop();
  await database.close();
});

const send = (method: "POST" | "PUT", url: string, payload: unknown) =>
  app.inject({
    method,
    url,
    payload: payload as Record<string, unknown>,
    headers: TRACKER_HEADERS,
  });

const FUTURE = new Date("2099-01-01T00:00:00.000Z");
const reviewedWithTrack = async () =>
  (await new AlphaRepository(database.db).flightFacts(FUTURE)).filter(
    (f) => f.closedAt !== null && f.hasTrack && f.phases === "wrong",
  ).length;

describe("alpha facts (spec J3)", () => {
  it("joins each flight with its trajectory and its review, from the given date", async () => {
    const before = await reviewedWithTrack();
    const flight = syntheticFlight();
    flight.open.openedAt = "2099-06-01T08:00:00.000Z";
    flight.close.closedAt = "2099-06-01T09:30:00.000Z";
    const id = flight.open.flightId;
    await send("POST", "/v1/flights", flight.open);
    await send("POST", `/v1/flights/${id}/close`, flight.close);
    await send("POST", `/v1/flights/${id}/track`, { points: syntheticTrack(60) });
    await send("PUT", `/v1/flights/${id}/review`, { phases: "wrong" });

    expect(await reviewedWithTrack()).toBe(before + 1);
    const facts = await new AlphaRepository(database.db).flightFacts(FUTURE);
    expect(facts.every((f) => f.openedAt >= FUTURE)).toBe(true);
  });
});
