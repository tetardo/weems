import type { FastifyInstance } from "fastify";
import type { AirportsService } from "./modules/airports/service.ts";
import { BoardingStream } from "./modules/live/boarding-stream.ts";
import type { LiveBoard } from "./modules/live/live-board.ts";
import { registerLiveRoutes } from "./modules/live/routes.ts";
import { LiveService } from "./modules/live/service.ts";
import type { LiveStream } from "./modules/live/stream.ts";

export interface LiveSources {
  board: LiveBoard;
  stream: LiveStream;
  airports: AirportsService;
}

/**
 * Live map and page Boarding: their public routes and streams. Returns the Boarding stream, which
 * the API starts and stops with its other jobs.
 */
export function registerLive(app: FastifyInstance, sources: LiveSources): BoardingStream {
  const live = new LiveService(sources.board, sources.airports);
  const boarding = new BoardingStream(() => live.boarding());
  registerLiveRoutes(app, { live: sources.stream, boarding }, live);
  return boarding;
}
