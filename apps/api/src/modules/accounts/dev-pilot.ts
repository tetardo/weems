import { DEV_PILOT_LOGIN } from "@weems/contrats";
import { hashPassword } from "better-auth/crypto";
import { DEV_PILOT_ID } from "../../plugins/auth.ts";
import type { AccountsRepository } from "./repository.ts";

/** Development login of the site, owner of every flight sent with the development token. */
const DEV_PILOT = { ...DEV_PILOT_LOGIN, name: "Pilote de développement" } as const;

/** Development and tests only: never called in production (see app.ts). */
export async function ensureDevPilot(repository: AccountsRepository): Promise<void> {
  await repository.ensureDevPilot({
    id: DEV_PILOT_ID,
    name: DEV_PILOT.name,
    email: DEV_PILOT.email,
    passwordHash: await hashPassword(DEV_PILOT.password),
  });
}
