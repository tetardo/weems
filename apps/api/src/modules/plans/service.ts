import type { FeatureKey, FeatureValue, MyPlan, PlanCatalog, PlanId } from "@weems/contrats";
import { PLAN_CATALOG } from "./catalog.ts";
import { addMonths, nextGiftStart, runningGift } from "./offered.ts";
import type { GrantSource, GrantsRepository } from "./repository-grants.ts";
import type { TestPlansRepository } from "./repository.ts";

/**
 * Plans and what they include (cadrage 05). No subscription exists yet (payment: lot 2): a pilot
 * is on Pilot Free unless Pilot Pro was given to them (founder offer, offer code: table
 * plan_grants). Outside production, the test switch of the site bar picks the plan of the
 * caller's account (table test_plans), so that locked cards can be tried; it wins over a gift.
 */
export class PlansService {
  private readonly grants: GrantsRepository;
  private readonly testPlans: TestPlansRepository | null;
  private readonly now: () => Date;

  constructor(
    grants: GrantsRepository,
    testPlans: TestPlansRepository | null,
    now: () => Date = () => new Date(),
  ) {
    this.grants = grants;
    this.testPlans = testPlans;
    this.now = now;
  }

  catalog(): PlanCatalog {
    return PLAN_CATALOG;
  }

  async planOf(pilotId: string): Promise<MyPlan> {
    const gift = runningGift(await this.grants.running(pilotId, this.now()), this.now());
    const offered = gift && { source: gift.current.source, until: gift.until.toISOString() };
    const giftPlan = gift ? (gift.current.plan as PlanId) : null;
    const plan = (await this.testPlans?.planOf(pilotId)) ?? giftPlan ?? "pilot_free";
    return { plan, testSwitch: this.testPlans !== null, offered };
  }

  /**
   * Plan of every pilot who is not on Pilot Free (admin console, page Comptes): Pilot Pro given,
   * then the test switch, which wins as in planOf.
   */
  async plansByPilot(): Promise<Map<string, PlanId>> {
    const gifts = await this.grants.currentByPilot(this.now());
    const plans = new Map([...gifts].map(([pilotId, plan]) => [pilotId, plan as PlanId]));
    for (const [pilotId, plan] of (await this.testPlans?.allPlans()) ?? [])
      plans.set(pilotId, plan);
    return plans;
  }

  /** Value of a feature in the caller's plan: true, a limit, "unlimited", or false. */
  async valueOf(pilotId: string, key: FeatureKey): Promise<FeatureValue> {
    const { plan } = await this.planOf(pilotId);
    return PLAN_CATALOG.features.find((feature) => feature.key === key)?.values[plan] ?? false;
  }

  /** The caller's plan includes a feature: a limit or "unlimited" counts, false does not. */
  async includes(pilotId: string, key: FeatureKey): Promise<boolean> {
    return (await this.valueOf(pilotId, key)) !== false;
  }

  /**
   * Gives Pilot Pro for `months`, after the gifts already running (they add up). Returns the end
   * of all of them.
   */
  async givePro(pilotId: string, months: number, source: GrantSource): Promise<Date> {
    const now = this.now();
    const startsAt = nextGiftStart(await this.grants.running(pilotId, now), now);
    const endsAt = addMonths(startsAt, months);
    await this.grants.insert(pilotId, { plan: "pilot_pro", source, startsAt, endsAt }, now);
    return endsAt;
  }

  /** Takes back the gifts of this source still running (a refused founder). */
  async takeBack(pilotId: string, source: GrantSource): Promise<void> {
    await this.grants.revoke(pilotId, source, this.now());
  }

  /** Test switch only: never called in production (the route does not exist there). */
  async setTestPlan(pilotId: string, plan: PlanId): Promise<MyPlan> {
    if (!this.testPlans) throw new Error("The plan test switch exists outside production only");
    await this.testPlans.setPlan(pilotId, plan);
    return this.planOf(pilotId);
  }
}
