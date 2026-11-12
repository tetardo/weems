import type { FastifyInstance } from "fastify";
import { FeatureKey, type PlanCatalog, PlanId } from "@weems/contrats";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { newPilot } from "../../testing/pilots.ts";
import { startTestApp } from "../../testing/test-app.ts";

let app: FastifyInstance;
let stop: () => Promise<void>;

beforeAll(async () => ({ app, stop } = await startTestApp()));
afterAll(() => stop());

async function catalog(): Promise<PlanCatalog> {
  const response = await app.inject({ method: "GET", url: "/v1/plans" });
  expect(response.statusCode).toBe(200);
  expect(response.headers["cache-control"]).toBe("public, max-age=300");
  return response.json<PlanCatalog>();
}

describe("GET /v1/plans", () => {
  it("lists the four plans, each containing the previous one", async () => {
    const { plans } = await catalog();
    expect(plans.map((plan) => plan.id)).toEqual(PlanId.options);
    expect(plans.map((plan) => plan.includes)).toEqual([
      null,
      "pilot_free",
      "pilot_pro",
      "company",
    ]);
  });

  it("describes every feature of the shared list once", async () => {
    const { features } = await catalog();
    expect(features.map((feature) => feature.key).sort()).toEqual([...FeatureKey.options].sort());
  });

  it("never takes a feature away from a plan that includes another", async () => {
    const { plans, features } = await catalog();
    const rank = (value: unknown) => (value === "unlimited" ? Infinity : Number(value));
    for (const plan of plans.filter((p) => p.includes)) {
      for (const { key, values } of features) {
        const parent = values[plan.includes as PlanId];
        expect(rank(values[plan.id]), `${plan.id} ${key}`).toBeGreaterThanOrEqual(rank(parent));
      }
    }
  });
});

describe("GET /v1/me/plan", () => {
  it("needs a pilot", async () => {
    const response = await app.inject({ method: "GET", url: "/v1/me/plan" });
    expect(response.statusCode).toBe(401);
  });

  it("puts every pilot on Pilot Free until subscriptions open, and offers the test switch", async () => {
    const cookie = await newPilot(app);
    const response = await app.inject({ method: "GET", url: "/v1/me/plan", headers: { cookie } });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ plan: "pilot_free", testSwitch: true });
  });
});
