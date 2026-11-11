import { describe, expect, it } from "vitest";
import { startLoopback } from "./loopback-server.ts";

describe("loopback server (RFC 8252)", () => {
  it("listens on 127.0.0.1 and hands over the browser's answer", async () => {
    const loopback = await startLoopback("/callback", 5_000);
    expect(loopback.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/);
    const page = await fetch(`${loopback.redirectUri}?code=abc&state=xyz`);
    expect(page.status).toBe(200);
    await expect(loopback.answer).resolves.toEqual({ code: "abc", state: "xyz", error: null });
  });

  it("ignores other paths and gives up after the time limit", async () => {
    const loopback = await startLoopback("/callback", 200);
    const other = await fetch(loopback.redirectUri.replace("/callback", "/favicon.ico"));
    expect(other.status).toBe(404);
    await expect(loopback.answer).rejects.toThrow("timed out");
  });
});
