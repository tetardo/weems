"use server";

import type { PlanId } from "@weems/contrats";
import { revalidatePath } from "next/cache";
import { setTestPlan } from "../api/plans-api.ts";

/** Action of the Free/Pro test switch: changes the plan, then every page reads it again. */
export async function testPlanAction(plan: PlanId): Promise<void> {
  await setTestPlan(plan);
  revalidatePath("/", "layout");
}
