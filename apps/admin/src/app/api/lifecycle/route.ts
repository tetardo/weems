import { NextResponse } from "next/server";
import { config } from "../../../server/console.ts";
import { isLocalScriptRequest, parseAction, runLifecycle } from "../../../server/lifecycle.ts";

/** POST { action: "start-all" | "stop-all" }: called by the Start and Stop icons of the Mac. */
export async function POST(request: Request) {
  if (!isLocalScriptRequest(request.headers, config().adminUrl)) {
    return NextResponse.json({ error: "Réservé aux scripts du Mac." }, { status: 403 });
  }
  const action = parseAction(await request.json().catch(() => null));
  if (!action) return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  try {
    await runLifecycle(action);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
