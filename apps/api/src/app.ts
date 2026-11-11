import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Config } from "./config.ts";
import type { DatabaseHandle } from "./db/client.ts";
import { registerAdminAccountRoutes } from "./modules/accounts/admin-routes.ts";
import { AdminAccountsService } from "./modules/accounts/admin-service.ts";
import { createAuth } from "./modules/accounts/auth.ts";
import { ensureDevPilot } from "./modules/accounts/dev-pilot.ts";
import { PilotIdentifier } from "./modules/accounts/pilot-identifier.ts";
import { AdminAccountsRepository } from "./modules/accounts/repository-admin.ts";
import { AccountsRepository } from "./modules/accounts/repository.ts";
import { registerAccountRoutes } from "./modules/accounts/routes.ts";
import { readAirportsFile } from "./modules/airports/airports-file.ts";
import { registerAirportRoutes } from "./modules/airports/routes.ts";
import { AirportsService } from "./modules/airports/service.ts";
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
import { LiveService } from "./modules/live/service.ts";
import { ProfilesRepository } from "./modules/profiles/repository.ts";
import { PublicProfilesService } from "./modules/profiles/public-service.ts";
import { registerPublicProfileRoutes } from "./modules/profiles/public-routes.ts";
import { registerProfileRoutes } from "./modules/profiles/routes.ts";
import { ProfilesService } from "./modules/profiles/service.ts";
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

/** Fastify with its plugins: validation, errors, documentation, rate limits. */
async function createServer(config: Config, logger: boolean): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger && { redact: ["req.headers.authorization"] },
    // request.ip is the visitor's, not the site server's (rate limits of the public routes).
    trustProxy: config.trustedProxies,
  });
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandling(app);
  await registerDocs(app);
  // Only on the routes that ask for it (public pages): the tracker and the site are not limited.
  await app.register(rateLimit, { global: false });
  return app;
}

/** Assembles the API: plugins, then modules. Starts nothing: see server.ts. */
export async function buildApp({
  config,
  database,
  logger = true,
}: AppDependencies): Promise<FastifyInstance> {
  const app = await createServer(config, logger);
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
  const identifier = new PilotIdentifier(auth, config.apiUrl, (id) => accounts.statusOf(id));
  const guards = registerAuth(app, config, identifier);
  registerAdminAccountRoutes(
    app,
    new AdminAccountsService(new AdminAccountsRepository(database.db), accounts, flights),
    guards,
  );
  registerFlightRoutes(app, flights, guards);
  if (config.env !== "production") registerDevFlightRoutes(app, flights, guards);
  const tracks = new TracksService(new PostgresTrackStore(database.db), flights);
  registerTrackRoutes(app, tracks, guards);
  registerReviewRoutes(
    app,
    new ReviewsService(new ReviewsRepository(database.db), flights),
    guards,
  );
  const profiles = new ProfilesRepository(database.db);
  registerProfileRoutes(app, new ProfilesService(profiles, flights, accounts), guards);
  registerPublicProfileRoutes(app, new PublicProfilesService(profiles, flights, tracks, accounts));
  const airports = new AirportsService(readAirportsFile());
  registerAirportRoutes(app, airports);
  registerLiveRoutes(app, stream, new LiveService(board, airports));
  if (config.env !== "production") registerDevLiveRoutes(app, board, stream);
  app.addHook("onReady", async () => stream.start());
  app.addHook("preClose", async () => stream.stop());

  await app.ready();
  return app;
}
