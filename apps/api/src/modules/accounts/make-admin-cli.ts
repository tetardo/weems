import { parseArgs } from "node:util";
import { loadConfig } from "../../config.ts";
import { connectDatabase } from "../../db/client.ts";
import { AdminAccountsRepository } from "./repository-admin.ts";

/**
 * Names the first administrator: `pnpm make-admin greg@example.com` (spec admin).
 * The account must exist; later administrators are invited from the admin console.
 */
const { positionals } = parseArgs({ allowPositionals: true });
const email = positionals[0];
if (!email?.includes("@")) {
  process.stderr.write("Usage: pnpm make-admin <e-mail>\n");
  process.exit(1);
}

const database = connectDatabase(loadConfig().databaseUrl);
try {
  if (await new AdminAccountsRepository(database.db).setRoleByEmail(email, "admin")) {
    process.stdout.write(`${email} est maintenant administrateur.\n`);
  } else {
    process.stderr.write(`Aucun compte pour ${email} : inscrivez-vous d'abord.\n`);
    process.exitCode = 1;
  }
} finally {
  await database.close();
}
