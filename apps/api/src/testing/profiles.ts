import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { newTrackerPilot } from "./pilots.ts";
import { syntheticFlight } from "./synthetic-flight.ts";
import { syntheticTrack } from "./synthetic-track.ts";

/** Tools of the profile tests (settings, public pages, logbook): flights sent, profile saved. */

export type Pilot = Awaited<ReturnType<typeof newTrackerPilot>>;

/** Every optional field of the profile, empty. */
const EMPTY_PROFILE = {
  country: null,
  homeIcao: null,
  level: null,
  vatsimId: null,
  ivaoId: null,
  instagram: null,
  facebook: null,
  simbriefId: null,
};

/** Unique across the test files, which run in parallel (a counter alone repeats in each file). */
export const uniqueHandle = () => `pilot-${randomUUID().replaceAll("-", "").slice(0, 16)}`;

/** A flight sent by the pilot's tracker; closed with a trajectory unless told otherwise. */
export async function fly(
  app: FastifyInstance,
  pilot: Pilot,
  { closed = true, touchdownVs = -120 } = {},
): Promise<string> {
  const flight = syntheticFlight();
  const { flightId } = flight.open;
  const send = (url: string, payload: unknown, method: "POST" | "PUT" = "POST") =>
    app.inject({ method, url, headers: pilot.tracker, payload: payload as object });
  await send("/v1/flights", flight.open);
  const events = flight.events.map((e) =>
    e.type === "touchdown" ? { ...e, context: { vs: touchdownVs } } : e,
  );
  await send(`/v1/flights/${flightId}/events`, { events });
  if (closed) {
    await send(`/v1/flights/${flightId}/close`, flight.close);
    await send(`/v1/flights/${flightId}/track`, { points: syntheticTrack(600) });
  }
  return flightId;
}

/** PUT /v1/me/profile with every field empty but those given. */
export const saveProfile = (app: FastifyInstance, pilot: Pilot, body: Record<string, unknown>) =>
  app.inject({
    method: "PUT",
    url: "/v1/me/profile",
    headers: { cookie: pilot.cookie },
    payload: { ...EMPTY_PROFILE, isPublic: false, handle: null, ...body },
  });
