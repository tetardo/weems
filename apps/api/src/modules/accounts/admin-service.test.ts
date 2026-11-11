import { describe, expect, it, vi } from "vitest";
import { AdminAccountsService, type FlightCounter } from "./admin-service.ts";
import type { AdminAccountsRepository } from "./repository-admin.ts";
import type { AccountsService } from "./service.ts";

const TARGET = "01970000-0000-7000-8000-0000000000aa";
const ADMIN = "01970000-0000-7000-8000-0000000000bb";

/** The last administrator rule, out of reach of the routes (an admin never changes their own account). */
describe("last administrator", () => {
  it("keeps their role (409) and is never written", async () => {
    const setRole = vi.fn();
    const repository = {
      countAdmins: async () => 1,
      setRole,
    } as unknown as AdminAccountsRepository;
    const accounts = {
      statusOf: async () => ({ role: "admin", disabledAt: null }),
    } as unknown as AccountsService;
    const flights: FlightCounter = { countByPilot: async () => new Map() };
    const service = new AdminAccountsService(repository, accounts, flights);

    await expect(service.update(ADMIN, TARGET, { role: "pilot" })).rejects.toMatchObject({
      status: 409,
    });
    expect(setRole).not.toHaveBeenCalled();
  });
});
