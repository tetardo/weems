import type { MyPlan, PlanCatalog } from "@weems/contrats";
import { PLAN_CATALOG } from "./catalog.ts";

/**
 * Plans and what they include (cadrage 05). No subscription exists yet (payment: lot 2), so every
 * pilot is on Pilot Free; the subscriptions table will answer here later.
 */
export class PlansService {
  catalog(): PlanCatalog {
    return PLAN_CATALOG;
  }

  planOf(_pilotId: string): MyPlan {
    return { plan: "pilot_free" };
  }
}
