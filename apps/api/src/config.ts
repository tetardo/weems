/** API settings, read once from environment variables at start-up. */
export interface Config {
  /** "development" accepts the fixed dev token; any other value refuses it (J0 has no other login). */
  env: "development" | "production" | "test";
  port: number;
  host: string;
  databaseUrl: string;
  devToken: string;
  /** Trackers older than this get 426 Upgrade Required. */
  minTrackerVersion: string;
  /** Apply pending database migrations at start-up (convenient with docker compose). */
  migrateOnStart: boolean;
  /**
   * Public address of the site, which also serves the login routes (/api/auth, proxied to the API).
   * Session cookies live there; the tracker opens it to log in.
   */
  siteUrl: string;
  /** Public address of the API: the audience of tracker access tokens. */
  apiUrl: string;
  /**
   * Address of the local console (apps/console), allowed to log in outside production only:
   * its server signs in to /api/auth with this origin.
   */
  consoleUrl: string;
  /** Signs sessions and keys; at least 32 characters, mandatory in production. */
  authSecret: string;
  /**
   * Addresses allowed to give the visitor's address (X-Forwarded-For): the site's server, which
   * calls the public routes for its visitors. Anyone else could fake it to escape the rate limits.
   */
  trustedProxies: string[];
}

const ENVS = ["development", "production", "test"] as const;

function readEnv(value: string | undefined): Config["env"] {
  const env = value ?? "development";
  if (!ENVS.includes(env as Config["env"])) {
    throw new Error(`WEEMS_ENV must be one of ${ENVS.join(", ")}, got "${env}"`);
  }
  return env as Config["env"];
}

const DEV_AUTH_SECRET = "development-secret-not-for-production-use";

function readAuthSecret(env: Config["env"], value: string | undefined): string {
  if (value && value.length >= 32) return value;
  if (env === "production")
    throw new Error("WEEMS_AUTH_SECRET (32 characters or more) is mandatory in production");
  return DEV_AUTH_SECRET;
}

/** Addresses of the site, the API and the local console. */
function readAddresses(
  source: NodeJS.ProcessEnv,
): Pick<Config, "siteUrl" | "apiUrl" | "consoleUrl"> {
  return {
    siteUrl: source["WEEMS_SITE_URL"] ?? "http://localhost:3001",
    apiUrl: source["WEEMS_API_URL"] ?? "http://localhost:3000",
    consoleUrl: source["WEEMS_CONSOLE_URL"] ?? "http://127.0.0.1:3002",
  };
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  const env = readEnv(source["WEEMS_ENV"]);
  return {
    env,
    port: Number(source["PORT"] ?? 3000),
    host: source["HOST"] ?? "0.0.0.0",
    databaseUrl: source["DATABASE_URL"] ?? "postgres://weems:weems@localhost:5432/weems",
    devToken: source["WEEMS_DEV_TOKEN"] ?? "dev-token",
    minTrackerVersion: source["WEEMS_MIN_TRACKER_VERSION"] ?? "0.1.0",
    migrateOnStart: source["WEEMS_MIGRATE_ON_START"] !== "false",
    ...readAddresses(source),
    authSecret: readAuthSecret(env, source["WEEMS_AUTH_SECRET"]),
    trustedProxies: (source["WEEMS_TRUSTED_PROXIES"] ?? "127.0.0.1,::1")
      .split(",")
      .map((address) => address.trim())
      .filter(Boolean),
  };
}
