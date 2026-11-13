import type {
  AccountRole,
  PlanId,
  AccountUpdate,
  AdminAccount,
  AdminAccountList,
  AdminInvitation,
  InvitationRequest,
} from "@weems/contrats";
import { DEV_PILOT_ID } from "../../plugins/auth.ts";
import { ApiProblem } from "../../plugins/problem.ts";
import type { InvitationRecord } from "./repository.ts";
import type { AccountRecord, AdminAccountsRepository } from "./repository-admin.ts";
import type { AccountsService } from "./service.ts";

/** Number of flights of each pilot: implemented by the flights module. */
export interface FlightCounter {
  countByPilot(): Promise<Map<string, number>>;
}

/** Address of each public profile: implemented by the profiles module. */
interface ProfileDirectory {
  publicHandles(): Promise<Map<string, string>>;
}

/** Plan of each pilot not on Pilot Free: implemented by the plans module. */
interface PlanDirectory {
  plansByPilot(): Promise<Map<string, PlanId>>;
}

/** What the page Comptes reads from the other modules. */
export interface AccountSources {
  flights: FlightCounter;
  profiles: ProfileDirectory;
  plans: PlanDirectory;
}

interface Directory {
  flights: Map<string, number>;
  handles: Map<string, string>;
  plans: Map<string, PlanId>;
}

const asRole = (role: string): AccountRole => (role === "admin" ? "admin" : "pilot");

function toInvitation(invitation: InvitationRecord): AdminInvitation {
  return {
    code: invitation.code,
    email: invitation.email,
    role: asRole(invitation.role),
    createdAt: invitation.createdAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

function toAccount(account: AccountRecord, { flights, handles, plans }: Directory): AdminAccount {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    role: asRole(account.role),
    disabledAt: account.disabledAt?.toISOString() ?? null,
    development: account.id === DEV_PILOT_ID,
    fictitious: account.fictitious,
    publicHandle: handles.get(account.id) ?? null,
    plan: plans.get(account.id) ?? "pilot_free",
    flights: flights.get(account.id) ?? 0,
    createdAt: account.createdAt.toISOString(),
    lastLoginAt: account.lastLoginAt?.toISOString() ?? null,
  };
}

/** Console, page Comptes (console spec): list, invite, change a role, disable. */
export class AdminAccountsService {
  private readonly repository: AdminAccountsRepository;
  private readonly accounts: AccountsService;
  private readonly sources: AccountSources;

  constructor(
    repository: AdminAccountsRepository,
    accounts: AccountsService,
    sources: AccountSources,
  ) {
    this.repository = repository;
    this.accounts = accounts;
    this.sources = sources;
  }

  async list(): Promise<AdminAccountList> {
    const [accounts, invitations, flights, handles, plans] = await Promise.all([
      this.repository.listAccounts(),
      this.accounts.openInvitations(),
      this.sources.flights.countByPilot(),
      this.sources.profiles.publicHandles(),
      this.sources.plans.plansByPilot(),
    ]);
    return {
      accounts: accounts.map((account) => toAccount(account, { flights, handles, plans })),
      invitations: invitations.map(toInvitation),
    };
  }

  async account(userId: string): Promise<AdminAccount> {
    const found = (await this.list()).accounts.find((account) => account.id === userId);
    if (!found) throw new ApiProblem(404, "Not Found", `No account ${userId}.`);
    return found;
  }

  async invite(request: InvitationRequest): Promise<AdminInvitation> {
    return toInvitation(await this.accounts.createInvitation(request.email, request.role));
  }

  async renew(code: string): Promise<AdminInvitation> {
    return toInvitation(await this.accounts.renewInvitation(code));
  }

  cancel(code: string): Promise<void> {
    return this.accounts.cancelInvitation(code);
  }

  /** One change, by an administrator: never on their own account, never the last administrator. */
  async update(adminId: string, userId: string, update: AccountUpdate): Promise<AdminAccount> {
    const target = await this.accounts.statusOf(userId);
    if (!target) throw new ApiProblem(404, "Not Found", `No account ${userId}.`);
    if (userId === adminId) {
      throw new ApiProblem(403, "Forbidden", "An administrator cannot change their own account.");
    }
    if ("role" in update) await this.changeRole(userId, target.role, update.role);
    else if (update.disabled) await this.repository.disable(userId, new Date());
    else await this.repository.enable(userId);
    return this.account(userId);
  }

  private async changeRole(userId: string, from: string, to: AccountRole): Promise<void> {
    if (from === "admin" && to !== "admin" && (await this.repository.countAdmins()) <= 1) {
      throw new ApiProblem(409, "Conflict", "The last administrator keeps their role.");
    }
    await this.repository.setRole(userId, to);
  }
}
