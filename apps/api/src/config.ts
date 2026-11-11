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
}

const ENVS = ["development", "production", "test"] as const;

function readEnv(value: string | undefined): Config["env"] {
  const env = value ?? "development";
  if (!ENVS.includes(env as Config["env"])) {
    throw new Error(`WEEMS_ENV must be one of ${ENVS.join(", ")}, got "${env}"`);
  }
  return env as Config["env"];
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): Config {
  return {
    env: readEnv(source["WEEMS_ENV"]),
    port: Number(source["PORT"] ?? 3000),
    host: source["HOST"] ?? "0.0.0.0",
    databaseUrl: source["DATABASE_URL"] ?? "postgres://weems:weems@localhost:5432/weems",
    devToken: source["WEEMS_DEV_TOKEN"] ?? "dev-token",
    minTrackerVersion: source["WEEMS_MIN_TRACKER_VERSION"] ?? "0.1.0",
    migrateOnStart: source["WEEMS_MIGRATE_ON_START"] !== "false",
  };
}
