import { getSiteStats } from "../api/public-api.ts";
import { LiveLink } from "./live-link.tsx";

/** Live counter of the bar, read on the server; the plain link when the API does not answer. */
export async function LiveStatus() {
  const stats = await getSiteStats().catch(() => null);
  return <LiveLink count={stats?.liveFlights ?? null} />;
}
