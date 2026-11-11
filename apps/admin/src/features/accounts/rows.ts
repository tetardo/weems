import type { AdminAccount, AdminAccountList, AdminInvitation } from "@weems/contrats";

/** A line of the table: an account, or an invitation not used yet (spec admin, page Comptes). */
export type Row =
  { kind: "account"; account: AdminAccount } | { kind: "invitation"; invitation: AdminInvitation };

export type Filter = "all" | "pilots" | "admins" | "invitations";

const matches = (search: string, ...texts: string[]) =>
  texts.some((text) => text.toLowerCase().includes(search.trim().toLowerCase()));

export function rowsOf(list: AdminAccountList, filter: Filter, search: string): Row[] {
  const accounts: Row[] = list.accounts
    .filter(
      (a) =>
        filter === "all" ||
        (filter === "pilots" && a.role === "pilot") ||
        (filter === "admins" && a.role === "admin"),
    )
    .filter((a) => matches(search, a.name, a.email))
    .map((account) => ({ kind: "account", account }));
  const invitations: Row[] =
    filter === "all" || filter === "invitations"
      ? list.invitations
          .filter((i) => matches(search, i.email))
          .map((invitation) => ({ kind: "invitation", invitation }))
      : [];
  return [...accounts, ...invitations];
}

export function countsOf(list: AdminAccountList, nowMs: number) {
  return {
    accounts: list.accounts.length,
    pilots: list.accounts.filter((a) => a.role === "pilot").length,
    admins: list.accounts.filter((a) => a.role === "admin").length,
    invitations: list.invitations.length,
    expired: list.invitations.filter((i) => Date.parse(i.expiresAt) <= nowMs).length,
  };
}

/** « GR », « CR »… for the round avatar. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words.at(-1)] : [words[0]];
  return letters.map((word) => word?.[0]?.toUpperCase() ?? "").join("") || "?";
}
