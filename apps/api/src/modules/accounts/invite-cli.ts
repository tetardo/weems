import { parseArgs } from "node:util";
import { signupPath } from "@weems/contrats";
import { loadConfig } from "../../config.ts";
import { connectDatabase } from "../../db/client.ts";
import { AccountsRepository } from "./repository.ts";
import { AccountsService } from "./service.ts";

/**
 * Invites an alpha pilot: `pnpm invite pilot@example.com`.
 * Prints the code and the sign-up address to send to the pilot (by a private message, not in the repository).
 */
const { positionals } = parseArgs({ allowPositionals: true });
const email = positionals[0];
if (!email?.includes("@")) {
  process.stderr.write("Usage: pnpm invite <e-mail>\n");
  process.exit(1);
}

const config = loadConfig();
const database = connectDatabase(config.databaseUrl);
try {
  const invitation = await new AccountsService(
    new AccountsRepository(database.db),
  ).createInvitation(email);
  const until = invitation.expiresAt.toISOString().slice(0, 10);
  process.stdout.write(
    `Code: ${invitation.code} (valable jusqu'au ${until})\n` +
      `Inscription : ${config.siteUrl}${signupPath("fr", invitation.code)}\n`,
  );
} finally {
  await database.close();
}
