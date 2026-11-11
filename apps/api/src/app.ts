import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Config } from "./config.ts";
import type { DatabaseHandle } from "./db/client.ts";
import { createAuth } from "./modules/accounts/auth.ts";
import { ensureDevPilot } from "./modules/accounts/dev-pilot.ts";
import { PilotIdentifier } from "./modules/accounts/pilot-identifier.ts";
import { AccountsRepository } from "./modules/accounts/repository.ts";
import { registerAccountRoutes } from "./modules/accounts/routes.ts";
import { AccountsService } from "./modules/accounts/service.ts";
import { ensureTrackerClient } from "./modules/accounts/tracker-client.ts";
import { registerDevFlightRoutes } from "./modules/flights/dev-routes.ts";
import { FlightsRepository } from "./modules/flights/repository.ts";
import { registerFlightRoutes } from "./modules/flights/routes.ts";
import { FlightsService } from "./modules/flights/service.ts";
import { registerHealthRoutes } from "./modules/health/routes.ts";
import { LiveBoard } from "./modules/live/live-board.ts";
import { registerDevLiveRoutes } from "./modules/live/dev-routes.ts";
import { registerLiveRoutes } from "./modules/live/routes.ts";
import { ReviewsRepository } from "./modules/reviews/repository.ts";
import { registerReviewRoutes } from "./modules/reviews/routes.ts";
import { ReviewsService } from "./modules/reviews/service.ts";
import { PostgresTrackStore } from "./modules/tracks/repository.ts";
import { registerTrackRoutes } from "./modules/tracks/routes.ts";
import { TracksService } from "./modules/tracks/service.ts";
import { LiveStream } from "./modules/live/stream.ts";
import { registerAuth } from "./plugins/auth.ts";
import { registerDocs } from "./plugins/docs.ts";
import { registerErrorHandling } from "./plugins/errors.ts";

export interface AppDependencies {
  config: Config;
  database: DatabaseHandle;
  /** Log requests (off in tests). */
  logger?: boolean;
}

/** Assembles the API: plugins, then modules. Starts nothing: see server.ts. */
export async function buildApp({
  config,
  database,
  logger = true,
}: AppDependencies): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger && { redact: ["req.headers.authorization"] },
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandling(app);
  await registerDocs(app);

  registerHealthRoutes(app, database.ping);
  const board = new LiveBoard();
  const stream = new LiveStream(board);
  const flights = new FlightsService(new FlightsRepository(database.db), board);
  const accountsRepository = new AccountsRepository(database.db);
  const accounts = new AccountsService(accountsRepository);
  const auth = createAuth(config, database.db, accounts);
  await ensureTrackerClient(accountsRepository, config);
  if (config.env !== "production") await ensureDevPilot(accountsRepository);
  registerAccountRoutes(app, auth, config);
  const guards = registerAuth(app, config, new PilotIdentifier(auth, config.apiUrl));
  registerFlightRoutes(app, flights, guards);
  if (config.env !== "production") registerDevFlightRoutes(app, flights, guards);
  const tracks = new TracksService(new PostgresTrackStore(database.db), flights);
  registerTrackRoutes(app, tracks, guards);
  registerReviewRoutes(
    app,
    new ReviewsService(new ReviewsRepository(database.db), flights),
    guards,
  );
  registerLiveRoutes(app, stream);
  if (config.env !== "production") registerDevLiveRoutes(app, board, stream);
  app.addHook("onReady", async () => stream.start());
  app.addHook("preClose", async () => stream.stop());

  await app.ready();
  return app;
}
