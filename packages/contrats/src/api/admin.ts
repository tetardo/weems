import { z } from "zod";
import { UtcTimestamp } from "./common.ts";
import { PlanId } from "./plans.ts";

/**
 * Routes /v1/admin/*, for the local admin console (spec admin, docs/cahiers-des-charges/admin).
 * Reserved to accounts with the administrator role, logged in with a session cookie.
 */

export const AccountRole = z.enum(["pilot", "admin"]);
export type AccountRole = z.infer<typeof AccountRole>;

/** Language of the sign-up page an invitation link opens. */
export const SignupLanguage = z.enum(["fr", "en"]);
export type SignupLanguage = z.infer<typeof SignupLanguage>;

/** Days an invitation stays valid. */
export const INVITATION_DAYS = 14;

/** Path of the sign-up page for an invitation code, on the website. */
export const signupPath = (language: SignupLanguage, code: string): string =>
  `/${language}/signup?code=${encodeURIComponent(code)}`;

export const AdminAccount = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string(),
  role: AccountRole,
  /** Null while active. */
  disabledAt: UtcTimestamp.nullable(),
  /** The development pilot (pnpm simulate, pnpm fly), outside production only. */
  development: z.boolean(),
  /** Fictitious account of the simulated activity (page Activité simulée), outside production only. */
  fictitious: z.boolean(),
  /** Address of the public profile (/pilots/{handle}) when the profile is public; null otherwise. */
  publicHandle: z.string().nullable(),
  /** Plan in force (Pilot Free until subscriptions open; outside production, the test switch). */
  plan: PlanId,
  flights: z.number().int().nonnegative(),
  createdAt: UtcTimestamp,
  /** Last session opened, on the site or by the tracker's login; null if never. */
  lastLoginAt: UtcTimestamp.nullable(),
});
export type AdminAccount = z.infer<typeof AdminAccount>;

/** An invitation not used yet (expired ones included). */
export const AdminInvitation = z.object({
  code: z.string(),
  email: z.string(),
  role: AccountRole,
  createdAt: UtcTimestamp,
  expiresAt: UtcTimestamp,
});
export type AdminInvitation = z.infer<typeof AdminInvitation>;

/** GET /v1/admin/accounts: everything, newest first (a few hundred rows at most in lot 1). */
export const AdminAccountList = z.object({
  accounts: z.array(AdminAccount),
  invitations: z.array(AdminInvitation),
});
export type AdminAccountList = z.infer<typeof AdminAccountList>;

/** POST /v1/admin/invitations */
export const InvitationRequest = z.object({
  email: z.email(),
  role: AccountRole.default("pilot"),
});
export type InvitationRequest = z.infer<typeof InvitationRequest>;

/** PATCH /v1/admin/accounts/{id}: one change at a time. */
export const AccountUpdate = z.union([
  z.object({ role: AccountRole }).strict(),
  z.object({ disabled: z.boolean() }).strict(),
]);
export type AccountUpdate = z.infer<typeof AccountUpdate>;

/** GET /v1/admin/me: the administrator logged in. */
export const AdminMe = z.object({ id: z.uuid(), name: z.string(), email: z.string() });
export type AdminMe = z.infer<typeof AdminMe>;
