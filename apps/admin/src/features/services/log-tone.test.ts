import { describe, expect, it } from "vitest";
import { toneOf } from "./log-tone.ts";

describe("toneOf", () => {
  it("colours a line by its level", () => {
    expect(toneOf("06:38:01 ERROR connection lost")).toBe("err");
    expect(toneOf("2026-11-13 05:38:01 UTC [42] FATAL:  role does not exist")).toBe("err");
    expect(toneOf("⨯ Error: Cannot find module")).toBe("err");
    expect(toneOf("06:38:01 WARN slow query 412 ms")).toBe("warn");
    expect(toneOf("2026-11-13 05:38:01 UTC [42] WARNING:  no transaction")).toBe("warn");
    expect(toneOf("06:38:01 DEBUG cache hit")).toBe("dim");
    expect(toneOf("06:38:01 INFO Server listening")).toBe("");
  });

  it("colours an API request by its status, whatever its level", () => {
    expect(toneOf("06:38:01 INFO GET /v1/me 500 3 ms")).toBe("err");
    expect(toneOf("06:38:01 INFO GET /v1/me 404 3 ms")).toBe("warn");
    expect(toneOf("06:38:01 INFO GET /v1/errors 200 3 ms")).toBe("");
  });
});
