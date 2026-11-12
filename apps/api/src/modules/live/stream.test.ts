import type { AddressInfo } from "node:net";
import type { FastifyInstance } from "fastify";
import type { LiveSnapshot, LiveUpdate } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { openSse } from "../../testing/sse-client.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
let url: string;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  await app.listen({ port: 0, host: "127.0.0.1" });
  url = `http://127.0.0.1:${(app.server.address() as AddressInfo).port}/v1/live/stream`;
});
afterAll(() => stop());

const post = (path: string, payload: object) =>
  app.inject({ method: "POST", url: path, payload, headers: TRACKER_HEADERS });
const until = async (check: () => boolean, timeoutMs = 5_000) => {
  const end = Date.now() + timeoutMs;
  while (!check() && Date.now() < end) await new Promise((r) => setTimeout(r, 50));
};

describe("GET /v1/live/stream", () => {
  it("sends a snapshot, then position batches within 2 s, then the removal on close", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", flight.open);
    const sse = openSse(url);
    await until(() => sse.events.length > 0);
    expect(sse.events[0]?.event).toBe("snapshot");
    const snapshot = sse.events[0]?.data as LiveSnapshot;
    expect(snapshot.flights.some((f) => f.flightId === id)).toBe(false);

    const sentAt = Date.now();
    await post(`/v1/flights/${id}/positions`, flight.position);
    const updates = () =>
      sse.events.filter((e) => e.event === "update").map((e) => e.data as LiveUpdate);
    await until(() => updates().some((u) => u.flights.some((f) => f.flightId === id)));
    const received = sse.events.find((e) => e.event === "update");
    expect((received?.receivedAtMs ?? Infinity) - sentAt).toBeLessThan(2_500);
    const live = updates()
      .flatMap((u) => u.flights)
      .find((f) => f.flightId === id);
    expect(live).toMatchObject({ callsign: "WMS123", position: flight.position, signal: "ok" });

    await post(`/v1/flights/${id}/close`, flight.close);
    await until(() => updates().some((u) => u.removed.includes(id)));
    expect(updates().some((u) => u.removed.includes(id))).toBe(true);
    await sse.close();
  });

  it("announces each take-off and landing once, even when the tracker sends events again", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", flight.open);
    const sse = openSse(url);
    await until(() => sse.events.length > 0);
    await post(`/v1/flights/${id}/positions`, flight.position);
    const firstHalf = flight.events.slice(0, 4);
    await post(`/v1/flights/${id}/events`, { events: firstHalf });
    await post(`/v1/flights/${id}/events`, { events: flight.events });
    const events = () =>
      sse.events
        .filter((e) => e.event === "update")
        .flatMap((e) => (e.data as LiveUpdate).events)
        .filter((e) => e.flightId === id);
    await until(() => events().some((e) => e.kind === "landing"));
    expect(events().map((e) => [e.kind, e.airportIcao, e.touchdownVs])).toEqual([
      ["takeoff", "LFPG", null],
      ["landing", "LFBO", -142.5],
    ]);
    await post(`/v1/flights/${id}/close`, flight.close);
    await sse.close();
  });
});
