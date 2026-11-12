import { randomInt } from "node:crypto";
import { type AccountRole, INVITATION_DAYS } from "@weems/contrats";
import { ApiProblem } from "../../plugins/problem.ts";
import type {
  AccountStatus,
  AccountsRepository,
  InvitationRecord,
  PilotIdentity,
} from "./repository.ts";

/** Readable on a screen or over the phone: no 0/O, 1/I/L. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

const forbidden = (detail: string) => new ApiProblem(403, "Forbidden", detail);
const conflict = (detail: string) => new ApiProblem(409, "Conflict", detail);
const notFound = (detail: string) => new ApiProblem(404, "Not Found", detail);

const normalized = (email: string) => email.trim().toLowerCase();

function newCode(): string {
  return Array.from(
    { length: CODE_LENGTH },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join("");
}

function stringField(body: unknown, field: string): string | null {
  if (typeof body !== "object" || body === null) return null;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === "string" ? value : null;
}

/** Closed alpha (J3): an account is created only with an unused invitation made for that e-mail. */
export class AccountsService {
  private readonly repository: AccountsRepository;

  private readonly now: () => number;

  constructor(repository: AccountsRepository, now: () => number = Date.now) {
    this.repository = repository;
    this.now = now;
  }

  /** A new invitation, valid 14 days (spec admin). Refused when the account already exists. */
  async createInvitation(email: string, role: AccountRole = "pilot"): Promise<InvitationRecord> {
    const address = normalized(email);
    if (await this.repository.userIdByEmail(address)) {
      throw conflict("An account already exists for this e-mail.");
    }
    const open = await this.repository.openInvitations();
    if (open.some((invitation) => invitation.email === address && !this.expired(invitation))) {
      throw conflict("An invitation is already waiting for this e-mail.");
    }
    return this.insert(address, role);
  }

  /** Replaces an unused invitation by a new code, valid 14 more days; the old link stops working. */
  async renewInvitation(code: string): Promise<InvitationRecord> {
    const old = await this.repository.deleteOpenInvitation(code);
    if (!old) throw notFound(`No open invitation ${code}.`);
    return this.insert(old.email, old.role === "admin" ? "admin" : "pilot");
  }

  async cancelInvitation(code: string): Promise<void> {
    if (!(await this.repository.deleteOpenInvitation(code))) {
      throw notFound(`No open invitation ${code}.`);
    }
  }

  async openInvitations(): Promise<InvitationRecord[]> {
    return this.repository.openInvitations();
  }

  private insert(email: string, role: AccountRole): Promise<InvitationRecord> {
    const expiresAt = new Date(this.now() + INVITATION_DAYS * DAY_MS);
    return this.repository.insertInvitation({ code: newCode(), email, role, expiresAt });
  }

  private expired(invitation: InvitationRecord): boolean {
    return invitation.expiresAt.getTime() <= this.now();
  }

  /** Throws 403 unless the sign-up carries a valid invitation code for its e-mail. */
  async checkSignUp(body: unknown): Promise<void> {
    const code = stringField(body, "inviteCode")?.trim().toUpperCase();
    const email = stringField(body, "email")?.trim().toLowerCase();
    const invitation = code ? await this.repository.findInvitation(code) : null;
    if (!invitation || invitation.email !== email) {
      throw forbidden("An invitation code made for this e-mail is required.");
    }
    if (invitation.usedAt) throw forbidden("This invitation code has already been used.");
    if (this.expired(invitation)) {
      throw forbidden("This invitation has expired: ask for a new one.");
    }
  }

  async signedUp(email: string): Promise<void> {
    await this.repository.markInvitationUsed(email);
  }

  /** Role and state of an account, or null when it does not exist. */
  statusOf(userId: string): Promise<AccountStatus | null> {
    return this.repository.statusOf(userId);
  }

  /** A disabled account cannot open a session (spec admin). */
  async checkLogin(userId: string): Promise<void> {
    if ((await this.repository.statusOf(userId))?.disabledAt) {
      throw forbidden("This account is disabled.");
    }
  }

  /** Accounts that are not disabled (home page counter). */
  countActive(): Promise<number> {
    return this.repository.countActive();
  }

  /** Public names of these accounts, by id; never their e-mail. */
  namesOf(pilotIds: string[]): Promise<Map<string, string>> {
    return this.repository.namesOf(pilotIds);
  }

  /** Public name and creation date of an account; never its e-mail. */
  async pilot(pilotId: string): Promise<PilotIdentity | null> {
    return this.repository.findPilot(pilotId);
  }
}
