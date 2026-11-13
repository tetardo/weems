import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot } from "../../testing/pilots.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

const switchTo = (cookie: string, plan: string) =>
  app.inject({ method: "PUT", url: "/v1/dev/me/plan", headers: { cookie }, payload: { plan } });
const myPlan = async (cookie: string) =>
  (await app.inject({ method: "GET", url: "/v1/me/plan", headers: { cookie } })).json();

describe("PUT /v1/dev/me/plan (Free/Pro test switch)", () => {
  it("needs a pilot", async () => {
    const response = await app.inject({
      method: "PUT",
      url: "/v1/dev/me/plan",
      payload: { plan: "pilot_pro" },
    });
    expect(response.statusCode).toBe(401);
  });

  it("changes the caller's plan, read back by GET /v1/me/plan", async () => {
    const cookie = await newPilot(app);
    const response = await switchTo(cookie, "pilot_pro");
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ plan: "pilot_pro", testSwitch: true, offered: null });
    expect(await myPlan(cookie)).toEqual({ plan: "pilot_pro", testSwitch: true, offered: null });
    expect((await switchTo(cookie, "pilot_free")).json()).toEqual({
      plan: "pilot_free",
      testSwitch: true,
      offered: null,
    });
  });

  it("changes nobody else's plan", async () => {
    const pro = await newPilot(app);
    const other = await newPilot(app);
    await switchTo(pro, "pilot_pro");
    expect(await myPlan(other)).toEqual({ plan: "pilot_free", testSwitch: true, offered: null });
  });

  it("refuses a plan that does not exist", async () => {
    const cookie = await newPilot(app);
    expect((await switchTo(cookie, "gold")).statusCode).toBe(400);
  });

  it("does not exist in production, where every pilot stays on Pilot Free", async () => {
    const production = await startTestApp({
      WEEMS_ENV: "production",
      WEEMS_AUTH_SECRET: "x".repeat(32),
    });
    try {
      const response = await production.app.inject({
        method: "PUT",
        url: "/v1/dev/me/plan",
        payload: { plan: "pilot_pro" },
      });
      expect(response.statusCode).toBe(404);
    } finally {
      await production.stop();
    }
  });
});
