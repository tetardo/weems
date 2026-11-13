import type { FastifyInstance } from "fastify";
import type { Pilot } from "./profiles.ts";
import { syntheticFlight } from "./synthetic-flight.ts";
import { syntheticTrack } from "./synthetic-track.ts";

const DAY_MS = 86_400_000;
const shifted = (iso: string, days: number) =>
  new Date(Date.parse(iso) + days * DAY_MS).toISOString();

/**
 * A complete flight that counts for the founder offer (real simulator, 50 min in the air,
 * 300 NM), flown `day` days after 11/11/2026; `simulator: "replay"` makes it a simulated one.
 */
export async function flyFounderFlight(
  app: FastifyInstance,
  pilot: Pilot,
  { day = 0, simulator = "msfs2024" as "msfs2024" | "replay" } = {},
): Promise<string> {
  const flight = syntheticFlight();
  const open = {
    ...flight.open,
    openedAt: shifted(flight.open.openedAt, day),
    aircraft: { ...flight.open.aircraft, simulator },
  };
  const events = flight.events.map((event) => ({ ...event, at: shifted(event.at, day) }));
  const close = { ...flight.close, closedAt: shifted(flight.close.closedAt, day) };
  const send = (url: string, payload: object) =>
    app.inject({ method: "POST", url, headers: pilot.tracker, payload });
  const { flightId } = open;
  await send("/v1/flights", open);
  await send(`/v1/flights/${flightId}/events`, { events });
  await send(`/v1/flights/${flightId}/close`, close);
  const track = await send(`/v1/flights/${flightId}/track`, { points: syntheticTrack(600) });
  if (track.statusCode !== 201) throw new Error(`track refused: ${track.body}`);
  return flightId;
}
