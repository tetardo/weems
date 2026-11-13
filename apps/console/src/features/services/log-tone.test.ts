import { describe, expect, it } from "vitest";
import { toneOf } from "./log-tone.ts";

describe("toneOf", () => {
  it("colours a line by its level", () => {
    expect(toneOf("06:38:01 ERROR connection lost")).toBe("err");
    expect(toneOf("2026-11-13 05:38:01 UTC [42] FATAL:  role does not exist")).toBe("err");
    expect(toneOf("⨯ Error: Cannot find module")).toBe("err");
    expect(toneOf("06:38:01 WARN slow query 412 ms")).toBe("warn");
    expect(toneOf("2026-11-13 05:38:01 UTC [42] WARNING:  no transaction")).toBe("warn");
    expect(toneOf(" ⚠ Port 3001 is in use")).toBe("warn");
    expect(toneOf("✓ Ready in 1421ms")).toBe("ok");
    expect(toneOf("06:38:01 DEBUG cache hit")).toBe("dim");
    expect(toneOf("06:38:01 INFO Server listening at http://127.0.0.1:3000")).toBe("");
    expect(toneOf("2026-11-13 05:38:01 UTC [42] LOG:  checkpoint starting")).toBe("");
  });

  it("colours an API request by its status, whatever its level", () => {
    expect(toneOf("06:38:01 INFO GET /v1/flights 200 3 ms")).toBe("ok");
    expect(toneOf("06:38:01 INFO GET /v1/me 404 0 ms")).toBe("warn");
    expect(toneOf("06:38:01 INFO GET /v1/me 500 3 ms")).toBe("err");
    expect(toneOf("06:38:01 INFO GET /v1/errors 200 3 ms")).toBe("ok");
    expect(toneOf("06:38:01 INFO GET /v1/me 304 1 ms")).toBe("");
  });

  it("colours a Next.js request by its status", () => {
    expect(toneOf(" GET /fr 200 in 9.6s (next.js: 7.8s, proxy.ts: 173ms)")).toBe("ok");
    expect(toneOf(" GET /fr/xyz 404 in 312ms")).toBe("warn");
    expect(toneOf(" GET /fr 500 in 41ms")).toBe("err");
  });
});
