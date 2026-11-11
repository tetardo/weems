import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const post = (url: string, payload: unknown, headers: Record<string, string> = TRACKER_HEADERS) =>
  app.inject({ method: "POST", url, payload: payload as object, headers });
const read = (flightId: string) =>
  app.inject({ method: "GET", url: `/v1/flights/${flightId}`, headers: TRACKER_HEADERS });

async function sendWholeFlight(flight: ReturnType<typeof syntheticFlight>) {
  const id = flight.open.flightId;
  return [
    await post("/v1/flights", flight.open),
    await post(`/v1/flights/${id}/events`, { events: flight.events }),
    await post(`/v1/flights/${id}/positions`, flight.position),
    await post(`/v1/flights/${id}/close`, flight.close),
  ];
}

describe("a complete synthetic flight (exit criterion 2)", () => {
  it("reads back exactly what was sent", async () => {
    const flight = syntheticFlight();
    const answers = await sendWholeFlight(flight);
    expect(answers.map((a) => a.statusCode)).toEqual([201, 201, 201, 201]);

    const view = await read(flight.open.flightId);
    expect(view.statusCode).toBe(200);
    const { trackerVersion: _version, ...opened } = flight.open;
    expect(view.json()).toEqual({
      ...opened,
      closedAt: flight.close.closedAt,
      closeReason: flight.close.reason,
      lastPhase: "CRUISE",
      aircraftClass: { category: "narrowBody", estimated: false },
      times: { blockS: 5400, airborneS: 3030, pausedS: 0 },
      events: flight.events,
    });
  });
});

describe("re-sends (exit criterion 3)", () => {
  it("answers 200 and changes nothing when every message is sent twice", async () => {
    const flight = syntheticFlight();
    await sendWholeFlight(flight);
    const before = (await read(flight.open.flightId)).json();

    const again = await sendWholeFlight(flight);
    expect(again.map((a) => a.statusCode)).toEqual([200, 200, 200, 200]);
    expect(again.map((a) => a.json())).toEqual(Array(4).fill({ result: "alreadyReceived" }));
    expect((await read(flight.open.flightId)).json()).toEqual(before);
  });

  it("stores only the new events of a partly re-sent batch", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", flight.open);
    await post(`/v1/flights/${id}/events`, { events: flight.events.slice(0, 3) });
    const answer = await post(`/v1/flights/${id}/events`, { events: flight.events });
    expect(answer.statusCode).toBe(201);
    expect((await read(id)).json().events).toEqual(flight.events);
  });
});

describe("same id, different content", () => {
  it("answers 409 for a flight and leaves it unchanged", async () => {
    const flight = syntheticFlight();
    await post("/v1/flights", flight.open);
    const answer = await post("/v1/flights", { ...flight.open, callsign: "OTHER" });
    expect(answer.statusCode).toBe(409);
    expect(answer.headers["content-type"]).toContain("application/problem+json");
    expect((await read(flight.open.flightId)).json().callsign).toBe("WMS123");
  });

  it("answers 409 for an event and stores nothing of the batch", async () => {
    const flight = syntheticFlight();
    const id = flight.open.flightId;
    await post("/v1/flights", flight.open);
    await post(`/v1/flights/${id}/events`, { events: flight.events.slice(0, 1) });
    const changed = { ...flight.events[0], context: { from: "BOARDING", to: "TAXI_OUT" } };
    const answer = await post(`/v1/flights/${id}/events`, {
      events: [changed, ...flight.events.slice(1)],
    });
    expect(answer.statusCode).toBe(409);
    expect((await read(id)).json().events).toEqual(flight.events.slice(0, 1));
  });

  it("answers 409 when closing an already closed flight differently", async () => {
    const flight = syntheticFlight();
    await sendWholeFlight(flight);
    const answer = await post(`/v1/flights/${flight.open.flightId}/close`, {
      ...flight.close,
      reason: "crash",
    });
    expect(answer.statusCode).toBe(409);
  });
});

describe("invalid requests", () => {
  it("answers 400 with a clear message for a latitude of 200°", async () => {
    const flight = syntheticFlight();
    await post("/v1/flights", flight.open);
    const answer = await post(`/v1/flights/${flight.open.flightId}/positions`, {
      ...flight.position,
      lat: 200,
    });
    expect(answer.statusCode).toBe(400);
    expect(answer.json().detail).toContain("/lat");
  });

  it("answers 400 when a field is missing", async () => {
    const { open } = syntheticFlight();
    const { openedAt: _missing, ...incomplete } = open;
    const answer = await post("/v1/flights", incomplete);
    expect(answer.statusCode).toBe(400);
    expect(answer.json().detail).toContain("/openedAt");
  });

  it("answers 404 for an unknown flight", async () => {
    const { open, close } = syntheticFlight();
    expect((await post(`/v1/flights/${open.flightId}/close`, close)).statusCode).toBe(404);
  });
});

describe("access", () => {
  it("answers 401 without the development token, before looking at the body", async () => {
    const answer = await post("/v1/flights", {}, { "weems-client": "tracker/0.1.0" });
    expect(answer.statusCode).toBe(401);
  });

  it("answers 426 to a tracker older than the minimum version", async () => {
    const answer = await post("/v1/flights", syntheticFlight().open, {
      ...TRACKER_HEADERS,
      "weems-client": "tracker/0.0.9",
    });
    expect(answer.statusCode).toBe(426);
  });
});
