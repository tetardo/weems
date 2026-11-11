import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";
import {
  exchange,
  invite,
  newPilot,
  PASSWORD,
  signUp,
  trackerLogin,
  uniqueEmail,
} from "../../testing/pilots.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => {
  ({ app, stop } = await startTestApp());
});
afterAll(() => stop());

const listFlights = (headers: Record<string, string>) =>
  app.inject({ method: "GET", url: "/v1/flights", headers });

describe("sign-up (closed alpha)", () => {
  it("refuses an account without invitation", async () => {
    const response = await signUp(app, {
      email: uniqueEmail(),
      password: PASSWORD,
      name: "Nobody",
    });
    expect(response.statusCode).toBe(403);
  });

  it("refuses a code made for another e-mail, then accepts the right one once", async () => {
    const email = uniqueEmail();
    const inviteCode = await invite(email);
    const body = { email, password: PASSWORD, name: "Invited", inviteCode };
    expect((await signUp(app, { ...body, email: uniqueEmail() })).statusCode).toBe(403);
    expect((await signUp(app, body)).statusCode).toBe(200);
    expect((await signUp(app, body)).statusCode).toBe(403);
  });
});

describe("site session", () => {
  it("reads the pilot's own flights with the session cookie, and nothing without it", async () => {
    const cookie = await newPilot(app);
    const mine = await listFlights({ cookie });
    expect(mine.statusCode).toBe(200);
    expect(mine.json().flights).toEqual([]);
    expect((await listFlights({})).statusCode).toBe(401);
  });
});

describe("tracker login (OAuth 2.1, PKCE, loopback redirect)", () => {
  it("gets tokens, sends a flight as the pilot, and refreshes", async () => {
    const cookie = await newPilot(app);
    const tokens = await trackerLogin(app, cookie);
    expect(tokens.statusCode).toBe(200);
    const { access_token, refresh_token } = tokens.json();
    expect(refresh_token).toEqual(expect.any(String));

    const flight = syntheticFlight();
    const tracker = { authorization: `Bearer ${access_token}`, "weems-client": "tracker/0.1.0" };
    const opened = await app.inject({
      method: "POST",
      url: "/v1/flights",
      headers: tracker,
      payload: flight.open,
    });
    expect(opened.statusCode).toBe(201);

    const seen = await listFlights({ cookie });
    expect(seen.json().flights.map((f: { flightId: string }) => f.flightId)).toEqual([
      flight.open.flightId,
    ]);

    const refreshed = await exchange(app, {
      grant_type: "refresh_token",
      refresh_token,
      client_id: "weems-tracker",
      resource: "http://localhost:3000",
    });
    expect(refreshed.statusCode).toBe(200);
    expect(refreshed.json().access_token).toEqual(expect.any(String));
  });

  it("does not let another pilot read the flight", async () => {
    const owner = await trackerLogin(app, await newPilot(app));
    const flight = syntheticFlight();
    const headers = {
      authorization: `Bearer ${owner.json().access_token}`,
      "weems-client": "tracker/0.1.0",
    };
    await app.inject({ method: "POST", url: "/v1/flights", headers, payload: flight.open });

    const other = await newPilot(app);
    const read = await app.inject({
      method: "GET",
      url: `/v1/flights/${flight.open.flightId}`,
      headers: { cookie: other },
    });
    expect(read.statusCode).toBe(404);
  });

  it("refuses a forged token", async () => {
    const response = await listFlights({ authorization: "Bearer not.a.jwt" });
    expect(response.statusCode).toBe(401);
  });

  it("tells the tracker how to log in", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/tracker/login" });
    expect(response.json()).toMatchObject({ clientId: "weems-tracker", redirectPath: "/callback" });
  });
});
