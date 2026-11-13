import { NextResponse } from "next/server";
import { asAdmin } from "../../../actions/as-admin.ts";
import { config } from "../../../server/console.ts";
import { launcherOverview } from "../../../server/launcher-overview.ts";
import { isLocalScriptRequest } from "../../../server/lifecycle.ts";

/** GET: the four cards of the Mac launcher (database, API, users, revenue), from Supervision. */
export async function GET(request: Request) {
  if (!isLocalScriptRequest(request.headers, config().adminUrl)) {
    return NextResponse.json({ error: "Réservé aux programmes du Mac." }, { status: 403 });
  }
  try {
    const supervision = await asAdmin((api) => api.supervision());
    return NextResponse.json(launcherOverview(supervision));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
