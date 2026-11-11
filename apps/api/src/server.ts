import { buildApp } from "./app.ts";
import { loadConfig } from "./config.ts";
import { connectDatabase, migrateDatabase } from "./db/client.ts";

const config = loadConfig();
const database = connectDatabase(config.databaseUrl);
if (config.migrateOnStart) await migrateDatabase(database);

const app = await buildApp({ config, database });

const shutdown = async () => {
  await app.close();
  await database.close();
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await app.listen({ port: config.port, host: config.host });
