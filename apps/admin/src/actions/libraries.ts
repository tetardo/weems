"use server";

import { libraries } from "../server/console.ts";
import type { LibrariesView } from "../server/libraries/report.ts";
import { type ActionResult, attempt } from "./result.ts";

/** Page Librairies: the last report and whether a check is running (read every few seconds). */
export async function readLibraries(): Promise<ActionResult<LibrariesView>> {
  return attempt(() => libraries().view());
}

/** « Vérifier maintenant »: starts a check and returns at once; the page follows it. */
export async function checkLibraries(): Promise<ActionResult> {
  return attempt(async () => {
    libraries().start();
    return null;
  });
}
