import type { AdminAccountList } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { countsOf, initialsOf, rowsOf } from "./rows.ts";

const account = (name: string, email: string, role: "pilot" | "admin") => ({
  id: "01970000-0000-7000-8000-000000000001",
  name,
  email,
  role,
  disabledAt: null,
  development: false,
  fictitious: false,
  publicHandle: null,
  flights: 0,
  createdAt: "2026-11-10T10:00:00.000Z",
  lastLoginAt: null,
});
const invitation = (email: string, expiresAt: string) => ({
  code: email,
  email,
  role: "pilot" as const,
  createdAt: "2026-11-10T10:00:00.000Z",
  expiresAt,
});
const list: AdminAccountList = {
  accounts: [
    account("Greg", "greg@example.com", "admin"),
    account("Camille R.", "camille@example.com", "pilot"),
    { ...account("Léa Martin", "lea-martin-a1b2c3@fictif.weems.local", "pilot"), fictitious: true },
  ],
  invitations: [
    invitation("julien@example.com", "2026-11-24T10:00:00.000Z"),
    invitation("sarah@example.com", "2026-11-01T10:00:00.000Z"),
  ],
};
const NOW = Date.parse("2026-11-11T20:00:00Z");

describe("rows of the page Comptes", () => {
  it("filters by kind and searches names and e-mails", () => {
    expect(rowsOf(list, "all", "")).toHaveLength(5);
    expect(rowsOf(list, "fictitious", "")).toEqual([
      { kind: "account", account: list.accounts[2] },
    ]);
    expect(rowsOf(list, "admins", "")).toHaveLength(1);
    expect(rowsOf(list, "invitations", "")).toHaveLength(2);
    expect(rowsOf(list, "all", " CAMILLE ")).toEqual([
      { kind: "account", account: list.accounts[1] },
    ]);
    expect(rowsOf(list, "pilots", "julien")).toEqual([]);
  });

  it("counts, expired invitations apart", () => {
    expect(countsOf(list, NOW)).toEqual({
      accounts: 3,
      pilots: 2,
      admins: 1,
      fictitious: 1,
      invitations: 2,
      expired: 1,
    });
  });

  it("makes initials", () => {
    expect(initialsOf("Camille R.")).toBe("CR");
    expect(initialsOf("Greg")).toBe("G");
    expect(initialsOf(" ")).toBe("?");
  });
});
