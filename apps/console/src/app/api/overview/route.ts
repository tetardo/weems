import { NextResponse } from "next/server";
import { asAdmin } from "../../../actions/as-admin.ts";
import { config } from "../../../server/console.ts";
import { launcherFiles } from "../../../server/launcher-files.ts";
import { launcherOverview } from "../../../server/launcher-overview.ts";
import { isLocalScriptRequest } from "../../../server/lifecycle.ts";

/** GET: the cards of the Mac launcher (database, files, API, users, revenue). */
export async function GET(request: Request) {
  if (!isLocalScriptRequest(request.headers, config().consoleUrl)) {
    return NextResponse.json({ error: "Réservé aux programmes du Mac." }, { status: 403 });
  }
  try {
    const [supervision, files] = await Promise.all([
      asAdmin((api) => api.supervision()),
      launcherFiles(config()),
    ]);
    return NextResponse.json(launcherOverview(supervision, files));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
