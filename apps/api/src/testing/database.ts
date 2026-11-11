import { connectDatabase, type DatabaseHandle } from "../db/client.ts";

/** Tests run against a real PostgreSQL (rules: no mocked database). Never the dev database. */
export const TEST_DATABASE_URL =
  process.env["TEST_DATABASE_URL"] ?? "postgres://weems:weems@localhost:5432/weems_test";

export function connectTestDatabase(): DatabaseHandle {
  return connectDatabase(TEST_DATABASE_URL);
}
