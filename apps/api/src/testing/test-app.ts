import type { FastifyInstance } from "fastify";
import { buildApp } from "../app.ts";
import { loadConfig } from "../config.ts";
import { connectTestDatabase } from "./database.ts";

export const TRACKER_HEADERS = {
  authorization: "Bearer dev-token",
  "weems-client": "tracker/0.1.0",
};

/** The real API on the test database, without network: requests go through app.inject. */
export async function startTestApp(): Promise<{ app: FastifyInstance; stop: () => Promise<void> }> {
  const config = loadConfig({ WEEMS_ENV: "test", WEEMS_DEV_TOKEN: "dev-token" });
  const database = connectTestDatabase();
  const app = await buildApp({ config, database, logger: false });
  return {
    app,
    stop: async () => {
      await app.close();
      await database.close();
    },
  };
}
