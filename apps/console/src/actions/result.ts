/** What a server action answers: never a thrown error, whose message Next.js would hide. */
export type ActionResult<T = null> = { ok: true; value: T } | { ok: false; error: string };

export async function attempt<T>(run: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, value: await run() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
