import { migrateDatabase } from "../db/client.ts";
import { connectTestDatabase, TEST_DATABASE_URL } from "./database.ts";

/** Brings the test database to the latest migration once, before all test files. */
export default async function setup(): Promise<void> {
  const database = connectTestDatabase();
  try {
    await migrateDatabase(database);
  } catch (error) {
    throw new Error(
      `Test database unreachable at ${TEST_DATABASE_URL}. On the Mac: docker compose -f apps/api/docker-compose.yml up -d db`,
      { cause: error },
    );
  } finally {
    await database.close();
  }
}
