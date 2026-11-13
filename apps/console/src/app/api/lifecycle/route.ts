import { LifecycleRequest } from "@weems/contrats";
import { NextResponse } from "next/server";
import { config } from "../../../server/console.ts";
import { isLocalScriptRequest, lifecycleStatus, runLifecycle } from "../../../server/lifecycle.ts";

const refused = () =>
  NextResponse.json({ error: "Réservé aux programmes du Mac." }, { status: 403 });

/** GET [?logs=db|api|site]: the services, for the Mac launcher. */
export async function GET(request: Request) {
  if (!isLocalScriptRequest(request.headers, config().consoleUrl)) return refused();
  const logsOf = new URL(request.url).searchParams.get("logs");
  return NextResponse.json(await lifecycleStatus(logsOf));
}

/** POST { action: "start-all" | "stop-all" } or { action: "start" | "stop" | "restart", service }. */
export async function POST(request: Request) {
  if (!isLocalScriptRequest(request.headers, config().consoleUrl)) return refused();
  const parsed = LifecycleRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  try {
    await runLifecycle(parsed.data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
