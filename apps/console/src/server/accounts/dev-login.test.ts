import { DEV_PILOT_LOGIN } from "@weems/contrats";
import { describe, expect, it, vi } from "vitest";
import { consoleConfig } from "../console-config.ts";
import { AdminApiError } from "./admin-api.ts";
import { devLogin, devLoginAllowed } from "./dev-login.ts";

const config = consoleConfig({});

describe("devLoginAllowed", () => {
  it("refuses a production build of the console", () => {
    expect(devLoginAllowed("production")).toBe(false);
    expect(devLoginAllowed("development")).toBe(true);
    expect(devLoginAllowed(undefined)).toBe(true);
  });
});

describe("devLogin", () => {
  it("logs in as the development pilot", async () => {
    const login = vi.fn().mockResolvedValue("session=abc");
    await expect(devLogin(config, login, "development")).resolves.toBe("session=abc");
    expect(login).toHaveBeenCalledWith(config, DEV_PILOT_LOGIN.email, DEV_PILOT_LOGIN.password);
  });

  it("never tries in production", async () => {
    const login = vi.fn();
    await expect(devLogin(config, login, "production")).resolves.toBeNull();
    expect(login).not.toHaveBeenCalled();
  });

  it("gives up when the API refuses the account", async () => {
    const login = vi.fn().mockRejectedValue(new AdminApiError(401, "refused"));
    await expect(devLogin(config, login, "development")).resolves.toBeNull();
  });

  it("lets other failures through (API stopped)", async () => {
    const login = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(devLogin(config, login, "development")).rejects.toThrow("fetch failed");
  });
});
