import type { FastifyInstance } from "fastify";
import type { AirportDetail, AirportList } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

const get = (codes: string) => app.inject({ method: "GET", url: `/v1/airports?codes=${codes}` });

describe("GET /v1/airports", () => {
  it("gives the known airports, without the unknown ones, to any origin", async () => {
    const response = await get("LFPG,ZZZZ,LFBO,LFPG");
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("*");
    const { airports } = response.json<AirportList>();
    expect(airports.map((airport) => airport.icao)).toEqual(["LFPG", "LFBO"]);
    expect(airports[0]).toMatchObject({ lat: 49.009, lon: 2.5541, iata: "CDG" });
    expect(airports[0]).not.toHaveProperty("runways");
  });

  it("refuses an empty list, a bad code and more than 100 codes", async () => {
    expect((await get("")).statusCode).toBe(400);
    expect((await get("lf-pg")).statusCode).toBe(400);
    const many = Array.from({ length: 101 }, (_, i) => `A${String(i).padStart(3, "0")}`);
    expect((await get(many.join(","))).statusCode).toBe(400);
  });
});

describe("GET /v1/airports/{icao}", () => {
  it("gives one airport in full, runways and frequencies included", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/airports/LFML" });
    expect(response.statusCode).toBe(200);
    expect(response.headers["access-control-allow-origin"]).toBe("*");
    const airport = response.json<AirportDetail>();
    expect(airport).toMatchObject({ icao: "LFML", iata: "MRS", type: "large_airport" });
    expect(airport.runways.flatMap((runway) => runway.ends.map((end) => end.ident))).toContain(
      "13L",
    );
    expect(airport.frequencies.map((frequency) => frequency.type)).toContain("TWR");
  });

  it("answers 404 for an unknown code and 400 for a bad one", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/airports/ZZZZ" })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/v1/airports/lf-ml" })).statusCode).toBe(400);
  });
});
