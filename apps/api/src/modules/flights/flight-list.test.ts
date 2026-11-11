import type { FastifyInstance } from "fastify";
import { uuidV7 } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp, TRACKER_HEADERS } from "../../testing/test-app.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;
/** A day of its own, new on each run: the test database keeps earlier runs' flights. */
const DAY = `${2100 + Math.floor(Math.random() * 7_900)}-02-03`;
const ids: string[] = [];

async function open(hour: number, changes: Partial<ReturnType<typeof syntheticFlight>["open"]>) {
  const { open: base } = syntheticFlight();
  const flight = {
    ...base,
    flightId: uuidV7(),
    openedAt: `${DAY}T${String(hour).padStart(2, "0")}:00:00.000Z`,
    ...changes,
  };
  await app.inject({
    method: "POST",
    url: "/v1/flights",
    payload: flight,
    headers: TRACKER_HEADERS,
  });
  ids.push(flight.flightId);
  return flight.flightId;
}
const list = async (query: string) =>
  (
    await app.inject({
      method: "GET",
      url: `/v1/flights?from=${DAY}T00:00:00.000Z&to=${DAY}T23:59:59.000Z&${query}`,
      headers: TRACKER_HEADERS,
    })
  ).json();

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
  await open(8, {});
  await open(9, { departureIcao: "EGLL", plannedArrivalIcao: "EHAM" });
  await open(10, {
    aircraft: { ...syntheticFlight().open.aircraft, title: "Cessna 172 Skyhawk", model: "C172" },
  });
  // An add-on missing from the catalogue, from a tracker that sends the engines.
  await open(11, {
    aircraft: {
      ...syntheticFlight().open.aircraft,
      title: "Zenith CH 701",
      model: "CH70",
      engineType: "piston",
    },
  });
  // The same unknown type from an older tracker: nothing to estimate from.
  await open(12, {
    aircraft: {
      ...syntheticFlight().open.aircraft,
      model: "CH70",
      engineType: null,
      airframe: null,
      maxGrossWeightKg: null,
    },
  });
});
afterAll(() => stop());

describe("flight list (spec J2)", () => {
  it("lists the newest first, page by page with a cursor", async () => {
    const first = await list("limit=2");
    expect(first.flights.map((f: { flightId: string }) => f.flightId)).toEqual([ids[4], ids[3]]);
    const second = await list(`limit=3&cursor=${first.nextCursor}`);
    expect(second.flights.map((f: { flightId: string }) => f.flightId)).toEqual([
      ids[2],
      ids[1],
      ids[0],
    ]);
    expect(second.nextCursor).toBeNull();
  });

  it("filters by aircraft and by airport", async () => {
    expect((await list("aircraft=c172")).flights).toHaveLength(1);
    expect((await list("aircraft=skyhawk")).flights).toHaveLength(1);
    expect((await list("airport=EHAM")).flights).toHaveLength(1);
    expect((await list("airport=LFPG")).flights).toHaveLength(4);
  });

  it("gives the aircraft category: from the catalogue, estimated, or unknown", async () => {
    const classes = (await list("")).flights.map(
      (f: { aircraftClass: unknown }) => f.aircraftClass,
    );
    expect(classes).toEqual([
      null,
      { category: "light", estimated: true },
      { category: "light", estimated: false },
      { category: "narrowBody", estimated: false },
      { category: "narrowBody", estimated: false },
    ]);
  });

  it("filters by aircraft category", async () => {
    expect((await list("category=light")).flights).toHaveLength(2);
    expect((await list("category=narrowBody")).flights).toHaveLength(2);
    expect((await list("category=helicopter")).flights).toHaveLength(0);
  });

  it("answers 400 to an unknown category", async () => {
    const answer = await app.inject({
      method: "GET",
      url: "/v1/flights?category=spaceship",
      headers: TRACKER_HEADERS,
    });
    expect(answer.statusCode).toBe(400);
  });

  it("gives times and alerts for each flight", async () => {
    const [flight] = (await list("aircraft=c172")).flights;
    expect(flight).toMatchObject({
      closedAt: null,
      times: { blockS: null, pausedS: 0 },
      alerts: [],
    });
  });

  it("answers 400 to an invalid cursor", async () => {
    const answer = await app.inject({
      method: "GET",
      url: "/v1/flights?cursor=bad",
      headers: TRACKER_HEADERS,
    });
    expect(answer.statusCode).toBe(400);
  });
});
