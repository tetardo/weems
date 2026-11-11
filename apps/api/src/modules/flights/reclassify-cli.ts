import { loadConfig } from "../../config.ts";
import { connectDatabase } from "../../db/client.ts";
import { reclassifyFlights } from "./reclassify.ts";
import { FlightsRepository } from "./repository.ts";

/** After a change to the aircraft catalogue: `pnpm reclassify` updates the recorded flights. */
const database = connectDatabase(loadConfig().databaseUrl);
try {
  const changed = await reclassifyFlights(new FlightsRepository(database.db));
  process.stdout.write(`${changed} flight(s) changed category.\n`);
} finally {
  await database.close();
}
