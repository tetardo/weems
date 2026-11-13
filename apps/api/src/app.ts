import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import type { Config } from "./config.ts";
import type { Database, DatabaseHandle } from "./db/client.ts";
import { countMigrationFiles, readMigrationFiles } from "./db/migration-journal.ts";
import { registerAdminAccountRoutes } from "./modules/accounts/admin-routes.ts";
import { AdminAccountsService } from "./modules/accounts/admin-service.ts";
import { AccountsCleanupService } from "./modules/accounts/cleanup-service.ts";
import { AccountsCleanupRepository } from "./modules/accounts/repository-cleanup.ts";
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
import { LogbookService } from "./modules/profiles/logbook-service.ts";
import { registerLogbookRoutes } from "./modules/profiles/logbook-routes.ts";
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
import { GoalsRepository } from "./modules/goals/repository.ts";
import { registerGoalRoutes } from "./modules/goals/routes.ts";
import { GoalsService } from "./modules/goals/service.ts";
import { registerPrivateLogbookRoutes } from "./modules/logbook/routes.ts";
import { PrivateLogbookService } from "./modules/logbook/service.ts";
import { registerPlanRoutes } from "./modules/plans/routes.ts";
import { registerDevPlanRoutes } from "./modules/plans/dev-routes.ts";
import { TestPlansRepository } from "./modules/plans/repository.ts";
import { GrantsRepository } from "./modules/plans/repository-grants.ts";
import { PlansService } from "./modules/plans/service.ts";
import { registerStatsRoutes } from "./modules/stats/routes.ts";
import { StatsService, type StatsSources } from "./modules/stats/service.ts";
import { SupervisionRepository } from "./modules/supervision/repository.ts";
import { SupervisionListsRepository } from "./modules/supervision/repository-lists.ts";
import { SupervisionSystemRepository } from "./modules/supervision/repository-system.ts";
import { HistoryRepository } from "./modules/database/history-repository.ts";
import { DatabaseRepository } from "./modules/database/repository.ts";
import { registerDatabaseRoutes } from "./modules/database/routes.ts";
import { DatabaseService } from "./modules/database/service.ts";
import { SizeRecorder } from "./modules/database/size-recorder.ts";
import { FlightsCleanupService } from "./modules/flights/cleanup-service.ts";
import type { LiveFeed } from "./modules/flights/live-feed.ts";
import { FlightsCleanupRepository } from "./modules/flights/repository-cleanup.ts";
import { registerSupervisionRoutes } from "./modules/supervision/routes.ts";
import { SupervisionService } from "./modules/supervision/service.ts";
import { registerTrafficHooks } from "./modules/supervision/traffic-hooks.ts";
import { TrafficMetrics } from "./modules/supervision/traffic-metrics.ts";
import { registerOffers } from "./offers-assembly.ts";
import { registerLive } from "./live-assembly.ts";
import { registerRanks } from "./ranks-assembly.ts";
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

/** What the home page reads (spec J4 accueil): counters and images set from the console. */
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

/** Page Supervision of the admin console: read-only counts, health, activity, community. */
function registerSupervision(
  app: FastifyInstance,
  deps: { database: DatabaseHandle; guards: Guards; board: LiveBoard; metrics: TrafficMetrics },
): void {
  const { db } = deps.database;
  const service = new SupervisionService({
    counts: new SupervisionRepository(db),
    lists: new SupervisionListsRepository(db),
    system: new SupervisionSystemRepository(db),
    live: deps.board,
    metrics: deps.metrics,
    expectedMigrations: countMigrationFiles(),
  });
  registerSupervisionRoutes(app, service, deps.guards);
}

/** Page Base de données of the admin console: sizes, migrations, cleanup of what is no longer needed. */
export function createDatabaseService(
  db: Database,
  live: Pick<LiveFeed, "closed">,
  now?: () => Date,
): DatabaseService {
  return new DatabaseService({
    repository: new DatabaseRepository(db),
    history: new HistoryRepository(db),
    flights: new FlightsCleanupService(new FlightsCleanupRepository(db), live),
    accounts: new AccountsCleanupService(new AccountsCleanupRepository(db)),
    migrationFiles: readMigrationFiles(),
    ...(now ? { now } : {}),
  });
}

/** Page Base de données: its routes, and the hourly size reading its charts need. */
function registerDatabasePage(
  app: FastifyInstance,
  deps: { database: DatabaseHandle; guards: Guards; board: LiveBoard },
): SizeRecorder {
  const service = createDatabaseService(deps.database.db, deps.board);
  registerDatabaseRoutes(app, service, deps.guards);
  return new SizeRecorder(
    () => service.record(),
    (err) => app.log.error({ err }, "Database size not recorded"),
  );
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

/** Profile pages: public ones (by handle, without account) and the pilot's own logbook. */
function registerProfilePages(
  app: FastifyInstance,
  guards: Guards,
  sources: {
    profiles: ProfilesRepository;
    flights: FlightsService;
    tracks: TracksService;
    accounts: AccountsService;
  },
): PublicProfilesService {
  const { profiles, flights, tracks, accounts } = sources;
  const pages = new PublicProfilesService(profiles, flights, tracks, accounts);
  registerPublicProfileRoutes(app, pages);
  registerLogbookRoutes(app, new LogbookService(profiles, pages), guards);
  return pages;
}

/** Plans (page Offres, caller's plan) and, outside production, the Free | Pro test switch. */
function registerPlans(
  app: FastifyInstance,
  database: DatabaseHandle,
  guards: Guards,
  testSwitch: boolean,
): PlansService {
  const testPlans = testSwitch ? new TestPlansRepository(database.db) : null;
  const plans = new PlansService(new GrantsRepository(database.db), testPlans);
  registerPlanRoutes(app, plans, guards);
  if (testSwitch) registerDevPlanRoutes(app, plans, guards);
  return plans;
}

/** Page Comptes of the admin console: accounts with their flights, public profile and plan. */
function registerAdminAccounts(
  app: FastifyInstance,
  database: DatabaseHandle,
  guards: Guards,
  deps: {
    accounts: AccountsService;
    flights: FlightsService;
    profileSettings: ProfilesService;
    plans: PlansService;
  },
): void {
  const admin = new AdminAccountsService(new AdminAccountsRepository(database.db), deps.accounts, {
    flights: deps.flights,
    profiles: deps.profileSettings,
    plans: deps.plans,
  });
  registerAdminAccountRoutes(app, admin, guards);
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
/** The pilot's private logbook: pages Résumé, Vols, Statistiques and Objectifs. */
function registerPrivateLogbook(
  app: FastifyInstance,
  database: DatabaseHandle,
  guards: Guards,
  deps: {
    flights: FlightsService;
    tracks: TracksService;
    plans: PlansService;
    airports: AirportsService;
  },
): void {
  const { flights, tracks, plans, airports } = deps;
  const logbook = new PrivateLogbookService(flights, tracks, plans, airports);
  registerPrivateLogbookRoutes(app, logbook, guards);
  const goals = new GoalsService(new GoalsRepository(database.db), flights, tracks, plans);
  registerGoalRoutes(app, goals, guards);
}

export async function buildApp({
  config,
  database,
  logger = true,
}: AppDependencies): Promise<FastifyInstance> {
  const app = await createServer(config, logger);
  const metrics = new TrafficMetrics();
  registerTrafficHooks(app, metrics);
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
  const plans = registerPlans(app, database, guards, config.env !== "production");
  registerAdminAccounts(app, database, guards, { accounts, flights, profileSettings, plans });
  registerFlightRoutes(app, flights, guards);
  const tracks = new TracksService(new PostgresTrackStore(database.db), flights);
  registerTrackRoutes(app, tracks, guards);
  const reviews = new ReviewsService(new ReviewsRepository(database.db), flights);
  registerReviewRoutes(app, reviews, guards);
  const airports = new AirportsService(readAirportsFile());
  registerPrivateLogbook(app, database, guards, { flights, tracks, plans, airports });
  registerProfileRoutes(app, profileSettings, guards);
  const publicProfiles = registerProfilePages(app, guards, { profiles, flights, tracks, accounts });
  board.showPilots(new LivePilots((ids) => publicProfiles.livePilots(ids)));
  registerOffers(app, { database, guards, accounts, flights, tracks, plans, publicProfiles });
  registerRanks(app, { guards, flights, tracks, publicProfiles });
  registerAirportRoutes(app, airports);
  const boarding = registerLive(app, { board, stream, airports });
  registerHomePage(app, database, guards, statsSources(accounts, flights, board));
  registerSupervision(app, { database, guards, board, metrics });
  const sizes = registerDatabasePage(app, { database, guards, board });
  if (config.env !== "production") {
    registerDevRoutes(app, { database, flights, profileSettings, guards, board, stream });
  }
  const jobs = [stream, boarding, sizes];
  app.addHook("onReady", async () => jobs.forEach((job) => job.start()));
  app.addHook("preClose", async () => jobs.forEach((job) => job.stop()));

  await app.ready();
  return app;
}
