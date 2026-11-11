import { loadConfig } from "../config.ts";
import { connectDatabase, migrateDatabase } from "./client.ts";

/** `pnpm db:migrate`: applies pending migrations to DATABASE_URL. */
const database = connectDatabase(loadConfig().databaseUrl);
await migrateDatabase(database);
await database.close();
