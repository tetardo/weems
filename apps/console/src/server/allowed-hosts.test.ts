import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isAllowedHost } from "./allowed-hosts.ts";

describe("console reachable from the Mac only (console spec, exit criterion 6)", () => {
  it("listens on 127.0.0.1, never on every interface", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    expect(pkg.scripts.dev).toContain("--hostname 127.0.0.1");
  });

  it("answers only to its own address (DNS rebinding refused)", () => {
    expect(isAllowedHost("127.0.0.1:3002")).toBe(true);
    expect(isAllowedHost("localhost:3002")).toBe(true);
    expect(isAllowedHost("evil.example:3002")).toBe(false);
    expect(isAllowedHost("192.168.1.20:3002")).toBe(false);
    expect(isAllowedHost(null)).toBe(false);
  });
});
