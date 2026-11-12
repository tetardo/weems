import type { FeatureKey, MyPlan, PlanCatalog, PlanId } from "@weems/contrats";
import { PLAN_CATALOG } from "./catalog.ts";
import type { TestPlansRepository } from "./repository.ts";

/**
 * Plans and what they include (cadrage 05). No subscription exists yet (payment: lot 2): in
 * production every pilot is on Pilot Free. Outside production, the test switch of the site bar
 * picks the plan of the caller's account (table test_plans), so that locked cards can be tried.
 */
export class PlansService {
  private readonly testPlans: TestPlansRepository | null;

  constructor(testPlans: TestPlansRepository | null) {
    this.testPlans = testPlans;
  }

  catalog(): PlanCatalog {
    return PLAN_CATALOG;
  }

  async planOf(pilotId: string): Promise<MyPlan> {
    const plan = (await this.testPlans?.planOf(pilotId)) ?? "pilot_free";
    return { plan, testSwitch: this.testPlans !== null };
  }

  /** The caller's plan includes a feature: a limit or "unlimited" counts, false does not. */
  async includes(pilotId: string, key: FeatureKey): Promise<boolean> {
    const { plan } = await this.planOf(pilotId);
    const value = PLAN_CATALOG.features.find((feature) => feature.key === key)?.values[plan];
    return value !== undefined && value !== false;
  }

  /** Test switch only: never called in production (the route does not exist there). */
  async setTestPlan(pilotId: string, plan: PlanId): Promise<MyPlan> {
    if (!this.testPlans) throw new Error("The plan test switch exists outside production only");
    await this.testPlans.setPlan(pilotId, plan);
    return this.planOf(pilotId);
  }
}
