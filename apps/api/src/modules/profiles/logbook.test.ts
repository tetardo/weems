import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newTrackerPilot } from "../../testing/pilots.ts";
import { fly, type Pilot, saveProfile, uniqueHandle } from "../../testing/profiles.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const read = (pilot: Pilot | null, url: string) =>
  app.inject({ method: "GET", url, headers: pilot ? { cookie: pilot.cookie } : {} });

describe("own logbook (« Mon carnet de bord »)", () => {
  it("shows the public page to its pilot even while the profile is not public", async () => {
    const pilot = await newTrackerPilot(app);
    const shown = await fly(app, pilot);
    await fly(app, pilot, { closed: false });
    const logbook = await read(pilot, "/v1/me/logbook");
    expect(logbook.statusCode).toBe(200);
    expect(logbook.json()).toMatchObject({ handle: null, isPublic: false, hasPhoto: false });
    expect(logbook.json().stats.flights).toBe(1);
    const list = (await read(pilot, "/v1/me/logbook/flights")).json();
    expect(list.flights.map((f: { flightId: string }) => f.flightId)).toEqual([shown]);
    expect((await read(pilot, "/v1/me/logbook/routes")).json().routes).toHaveLength(1);
  });

  it("leaves out hidden flights, as visitors see the page", async () => {
    const pilot = await newTrackerPilot(app);
    const handle = uniqueHandle();
    await saveProfile(app, pilot, { isPublic: true, handle });
    const hidden = await fly(app, pilot);
    await app.inject({
      method: "PUT",
      url: `/v1/flights/${hidden}/visibility`,
      headers: { cookie: pilot.cookie },
      payload: { hiddenOnProfile: true },
    });
    const logbook = (await read(pilot, "/v1/me/logbook")).json();
    expect(logbook).toMatchObject({ handle, isPublic: true });
    expect(logbook.stats.flights).toBe(0);
    expect(logbook.stats).toEqual((await read(null, `/v1/pilots/${handle}`)).json().stats);
    expect((await read(pilot, "/v1/me/logbook/flights")).json().flights).toEqual([]);
  });

  it("needs a session", async () => {
    for (const url of ["/v1/me/logbook", "/v1/me/logbook/flights", "/v1/me/logbook/routes"]) {
      expect((await read(null, url)).statusCode).toBe(401);
    }
  });
});
