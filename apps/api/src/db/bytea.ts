import { customType } from "drizzle-orm/pg-core";

/** Binary column (PostgreSQL bytea) read and written as a Node.js Buffer. */
export const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
