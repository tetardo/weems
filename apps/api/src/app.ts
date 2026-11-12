import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Config } from "./config.ts";
import type { DatabaseHandle } from "./db/client.ts";
import { registerAdminAccountRoutes } from "./modules/accounts/admin-routes.ts";
import { AdminAccountsService } from "./modules/accounts/admin-service.ts";
import { createAuth } from "./modules/accounts/auth.ts";
import { ensureDevPilot } from "./modules/accounts/dev-pilot.ts";
import { registerFictitiousPilotRoutes } from "./modules/accounts/fictitious-routes.ts";
import { FictitiousPilotsService } from "./modules/accounts/fictitious-service.ts";
import { FictitiousAccountsRepository } from "./modules/accounts/repository-fictitious.ts";
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
import { LivePilots } from "./modules/live/live-pilots.ts";
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
import { registerAdminSiteRoutes } from "./modules/site/admin-routes.ts";
import { SiteRepository } from "./modules/site/repository.ts";
import { registerSiteRoutes } from "./modules/site/routes.ts";
import { SiteService } from "./modules/site/service.ts";
import { registerStatsRoutes } from "./modules/stats/routes.ts";
import { StatsService, type StatsSources } from "./modules/stats/service.ts";
import { type Guards, registerAuth } from "./plugins/auth.ts";
import { registerDocs } from "./plugins/docs.ts";
import { registerErrorHandling } from "./plugins/errors.ts";

export interface AppDependencies {
  config: Config;
  database: DatabaseHandle;
  /** Log requests (off in tests). */
  logger?: boolean;
}

/** The counters of the home page, read from the services of their modules. */
function statsSources(accounts: AccountsService, flights: FlightsService, board: LiveBoard) {
  return {
    countPilots: () => accounts.countActive(),
    countFlights: () => flights.countAll(),
    countLiveFlights: () => board.flightCount,
  };
}

/** What the home page reads (spec J4 accueil) and its images, set from the console. */
function registerHomePage(
  app: FastifyInstance,
  database: DatabaseHandle,
  guards: Guards,
  sources: StatsSources,
): void {
  registerStatsRoutes(app, new StatsService(sources));
  const site = new SiteService(new SiteRepository(database.db));
  registerSiteRoutes(app, site);
  registerAdminSiteRoutes(app, site, guards);
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

/** Routes that exist outside production only (simulation, measures, fictitious pilots). */
function registerDevRoutes(
  app: FastifyInstance,
  deps: {
    database: DatabaseHandle;
    flights: FlightsService;
    profileSettings: ProfilesService;
    guards: Guards;
    board: LiveBoard;
    stream: LiveStream;
  },
): void {
  registerDevFlightRoutes(app, deps.flights, deps.guards);
  registerDevLiveRoutes(app, deps.board, deps.stream);
  const fictitious = new FictitiousPilotsService(
    new FictitiousAccountsRepository(deps.database.db),
    deps.flights,
    deps.profileSettings,
  );
  registerFictitiousPilotRoutes(app, fictitious, deps.guards);
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
  const stream = new LiveStream(board, (err) => app.log.error({ err }, "Live pilots not read"));
  const flights = new FlightsService(new FlightsRepository(database.db), board);
  const accountsRepository = new AccountsRepository(database.db);
  const accounts = new AccountsService(accountsRepository);
  const auth = createAuth(config, database.db, accounts);
  await ensureTrackerClient(accountsRepository, config);
  if (config.env !== "production") await ensureDevPilot(accountsRepository);
  registerAccountRoutes(app, auth, config);
  const identifier = new PilotIdentifier(auth, config.apiUrl, (id) => accounts.statusOf(id));
  const guards = registerAuth(app, config, identifier);
  const profiles = new ProfilesRepository(database.db);
  const profileSettings = new ProfilesService(profiles, flights, accounts);
  const adminRepository = new AdminAccountsRepository(database.db);
  const admin = new AdminAccountsService(adminRepository, accounts, flights, profileSettings);
  registerAdminAccountRoutes(app, admin, guards);
  registerFlightRoutes(app, flights, guards);
  const tracks = new TracksService(new PostgresTrackStore(database.db), flights);
  registerTrackRoutes(app, tracks, guards);
  const reviews = new ReviewsService(new ReviewsRepository(database.db), flights);
  registerReviewRoutes(app, reviews, guards);
  registerProfileRoutes(app, profileSettings, guards);
  const publicProfiles = new PublicProfilesService(profiles, flights, tracks, accounts);
  registerPublicProfileRoutes(app, publicProfiles);
  board.showPilots(new LivePilots((ids) => publicProfiles.livePilots(ids)));
  const airports = new AirportsService(readAirportsFile());
  registerAirportRoutes(app, airports);
  registerLiveRoutes(app, stream, new LiveService(board, airports));
  registerHomePage(app, database, guards, statsSources(accounts, flights, board));
  if (config.env !== "production") {
    registerDevRoutes(app, { database, flights, profileSettings, guards, board, stream });
  }
  app.addHook("onReady", async () => stream.start());
  app.addHook("preClose", async () => stream.stop());

  await app.ready();
  return app;
}
