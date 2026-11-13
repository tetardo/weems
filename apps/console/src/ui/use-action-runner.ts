"use client";

import { useState } from "react";
import type { ActionResult } from "../actions/result.ts";

/** Runs one server action at a time, keeps its error, then reads the page again. */
export function useActionRunner(refresh: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(action: () => Promise<ActionResult<T>>): Promise<boolean> {
    setBusy(true);
    const result = await action();
    setError(result.ok ? null : result.error);
    setBusy(false);
    await refresh();
    return result.ok;
  }

  return { busy, error, run };
}
