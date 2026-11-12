import {
  type AccountUpdate,
  AdminDatabase,
  AdminAccount,
  AdminAccountList,
  AdminInvitation,
  AdminMe,
  AdminSupervision,
  DatabaseCleanupResult,
  type DatabaseCleanupRequest,
  type InvitationRequest,
  Problem,
} from "@weems/contrats";
import type { z } from "zod";
import type { ConsoleConfig } from "../console-config.ts";

/** An answer of the API other than success: its RFC 9457 detail is shown as is. */
export class AdminApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function problemOf(response: Response): Promise<AdminApiError> {
  const body = Problem.safeParse(await response.json().catch(() => null));
  const detail = body.success ? (body.data.detail ?? body.data.title) : `HTTP ${response.status}`;
  return new AdminApiError(response.status, detail);
}

/** Routes /v1/admin/* of the API, as the administrator logged in (their session cookie). */
export class AdminApi {
  private readonly config: ConsoleConfig;
  private readonly cookie: string;

  constructor(config: ConsoleConfig, cookie: string) {
    this.config = config;
    this.cookie = cookie;
  }

  private async call<T>(
    schema: z.ZodType<T> | null,
    path: string,
    init: RequestInit = {},
    timeoutMs = 5_000,
  ): Promise<T> {
    const response = await fetch(new URL(path, this.config.apiUrl), {
      ...init,
      headers: {
        cookie: this.cookie,
        ...(init.body ? { "content-type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) throw await problemOf(response);
    return schema ? schema.parse(await response.json()) : (undefined as T);
  }

  me() {
    return this.call(AdminMe, "/v1/admin/me");
  }

  list() {
    return this.call(AdminAccountList, "/v1/admin/accounts");
  }

  /** Every figure of the page Supervision, in one read. */
  supervision() {
    return this.call(AdminSupervision, "/v1/admin/supervision");
  }

  /** Page Base de données: sizes, migrations, what the cleanup would delete. */
  database() {
    return this.call(AdminDatabase, "/v1/admin/database", {}, 15_000);
  }

  /** Deletes what is asked; a large cleanup can take a while. */
  cleanup(request: DatabaseCleanupRequest) {
    const init = { method: "POST", body: JSON.stringify(request) };
    return this.call(DatabaseCleanupResult, "/v1/admin/database/cleanup", init, 120_000);
  }

  invite(request: InvitationRequest) {
    return this.call(AdminInvitation, "/v1/admin/invitations", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  renew(code: string) {
    return this.call(AdminInvitation, `/v1/admin/invitations/${encodeURIComponent(code)}/renew`, {
      method: "POST",
    });
  }

  cancel(code: string) {
    return this.call(null, `/v1/admin/invitations/${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
  }

  update(id: string, update: AccountUpdate) {
    return this.call(AdminAccount, `/v1/admin/accounts/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(update),
    });
  }
}
