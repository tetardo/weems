import { randomInt } from "node:crypto";
import { ApiProblem } from "../../plugins/problem.ts";
import type { AccountsRepository } from "./repository.ts";

/** Readable on a screen or over the phone: no 0/O, 1/I/L. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 10;

const forbidden = (detail: string) => new ApiProblem(403, "Forbidden", detail);

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

  constructor(repository: AccountsRepository) {
    this.repository = repository;
  }

  async createInvitation(email: string): Promise<string> {
    const code = newCode();
    await this.repository.insertInvitation(code, email.trim().toLowerCase());
    return code;
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
  }

  async signedUp(email: string): Promise<void> {
    await this.repository.markInvitationUsed(email);
  }
}
