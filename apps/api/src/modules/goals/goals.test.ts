import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot, newTrackerPilot } from "../../testing/pilots.ts";
import { syntheticFlight } from "../../testing/synthetic-flight.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

const HOURS = { kind: "hours", target: 20, window: "month" };
const call = (cookie: string, method: "GET" | "POST" | "PUT", url: string, payload?: object) =>
  app.inject({ method, url, headers: { cookie }, ...(payload ? { payload } : {}) });
const pro = (cookie: string) => call(cookie, "PUT", "/v1/dev/me/plan", { plan: "pilot_pro" });

describe("goals (spec carnet privé, § 6)", () => {
  it("needs a pilot", async () => {
    expect((await app.inject({ method: "GET", url: "/v1/me/goals" })).statusCode).toBe(401);
  });

  it("counts the closed flights of the month", async () => {
    const { cookie, tracker } = await newTrackerPilot(app);
    const flight = syntheticFlight();
    const send = (url: string, payload: object) =>
      app.inject({ method: "POST", url, headers: tracker, payload });
    await send("/v1/flights", flight.open);
    await send(`/v1/flights/${flight.open.flightId}/close`, flight.close);
    const created = await call(cookie, "POST", "/v1/me/goals", {
      kind: "flights",
      target: 2,
      window: "none",
    });
    expect(created.statusCode).toBe(201);
    // The goal counts from the day it was created: the synthetic flight is older.
    expect(created.json()).toMatchObject({ status: "active", value: 0, total: 2, flights: 0 });
  });

  it("keeps one running goal for a free pilot, unlimited ones with Pilot Pro", async () => {
    const cookie = await newPilot(app);
    await call(cookie, "POST", "/v1/me/goals", HOURS);
    await call(cookie, "POST", "/v1/me/goals", { ...HOURS, target: 10 });
    const free = (await call(cookie, "GET", "/v1/me/goals")).json();
    expect(free).toMatchObject({ maxActive: 1, suggestions: null, goodPracticesAllowed: false });
    expect(free.active.map((g: { total: number }) => g.total)).toEqual([10]);
    expect(free.finished[0]).toMatchObject({ status: "archived" });

    await pro(cookie);
    await call(cookie, "POST", "/v1/me/goals", HOURS);
    const paid = (await call(cookie, "GET", "/v1/me/goals")).json();
    expect(paid).toMatchObject({ maxActive: null, suggestions: [], goodPracticesAllowed: true });
    expect(paid.active).toHaveLength(2);
  });

  it("keeps « Bonnes pratiques » for Pilot Pro and refuses a bad goal", async () => {
    const cookie = await newPilot(app);
    const practice = { kind: "goodPractices", target: 85, practice: "speed250", window: "none" };
    expect((await call(cookie, "POST", "/v1/me/goals", practice)).statusCode).toBe(403);
    await pro(cookie);
    expect((await call(cookie, "POST", "/v1/me/goals", practice)).statusCode).toBe(201);
    const bad = { kind: "softLandings", target: 5, window: "none" }; // no threshold
    expect((await call(cookie, "POST", "/v1/me/goals", bad)).statusCode).toBe(400);
  });

  it("changes and archives the pilot's own goals only", async () => {
    const cookie = await newPilot(app);
    const id = (await call(cookie, "POST", "/v1/me/goals", HOURS)).json().goalId;
    const changed = await call(cookie, "PUT", `/v1/me/goals/${id}`, { ...HOURS, target: 30 });
    expect(changed.json()).toMatchObject({ total: 30 });
    const other = await newPilot(app);
    expect((await call(other, "PUT", `/v1/me/goals/${id}`, HOURS)).statusCode).toBe(404);
    expect((await call(other, "POST", `/v1/me/goals/${id}/archive`)).statusCode).toBe(404);
    const archived = await call(cookie, "POST", `/v1/me/goals/${id}/archive`);
    expect(archived.json()).toMatchObject({ status: "archived" });
  });
});
