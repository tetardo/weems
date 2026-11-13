import type { AccountsCleanupRepository } from "./repository-cleanup.ts";

/** Expired sessions and invitations, for the page Base de données of the console. */
export class AccountsCleanupService {
  private readonly repository: AccountsCleanupRepository;

  constructor(repository: AccountsCleanupRepository) {
    this.repository = repository;
  }

  countExpired(now: Date): Promise<{ sessions: number; invitations: number }> {
    return this.repository.countExpired(now);
  }

  deleteExpiredSessions(now: Date): Promise<number> {
    return this.repository.deleteExpiredSessions(now);
  }

  deleteExpiredInvitations(now: Date): Promise<number> {
    return this.repository.deleteExpiredInvitations(now);
  }
}
