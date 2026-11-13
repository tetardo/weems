"use server";

import type { AdminSupervision } from "@weems/contrats";
import { asAdmin } from "./as-admin.ts";
import { type ActionResult, attempt } from "./result.ts";

/** The page Supervision: one read of the API as the administrator, every 10 s. */
export async function readSupervision(): Promise<ActionResult<AdminSupervision>> {
  return attempt(() => asAdmin((api) => api.supervision()));
}
