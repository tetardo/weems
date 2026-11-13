import { describe, expect, it } from "vitest";
import { LifecycleRequest, LOCAL_SCRIPT_HEADER } from "@weems/contrats";
import { isLocalScriptRequest } from "./lifecycle.ts";

const ADMIN = "http://127.0.0.1:3002";

describe("isLocalScriptRequest", () => {
  it("accepts the scripts: header set, no Origin (curl)", () => {
    expect(isLocalScriptRequest(new Headers({ [LOCAL_SCRIPT_HEADER]: "1" }), ADMIN)).toBe(true);
  });

  it("accepts the console's own origin", () => {
    const headers = new Headers({ [LOCAL_SCRIPT_HEADER]: "1", origin: ADMIN });
    expect(isLocalScriptRequest(headers, ADMIN)).toBe(true);
  });

  it("refuses a request without the header (a form posted by another page)", () => {
    expect(isLocalScriptRequest(new Headers(), ADMIN)).toBe(false);
  });

  it("refuses another origin even with the header", () => {
    const headers = new Headers({ [LOCAL_SCRIPT_HEADER]: "1", origin: "https://evil.example" });
    expect(isLocalScriptRequest(headers, ADMIN)).toBe(false);
  });
});

describe("LifecycleRequest", () => {
  it("reads the actions on everything and on one service", () => {
    expect(LifecycleRequest.parse({ action: "start-all" })).toEqual({ action: "start-all" });
    expect(LifecycleRequest.parse({ action: "stop-all" })).toEqual({ action: "stop-all" });
    const restart = { action: "restart", service: "api" };
    expect(LifecycleRequest.parse(restart)).toEqual(restart);
  });

  it("refuses anything else", () => {
    expect(LifecycleRequest.safeParse(null).success).toBe(false);
    expect(LifecycleRequest.safeParse("stop-all").success).toBe(false);
    expect(LifecycleRequest.safeParse({ action: "delete" }).success).toBe(false);
    expect(LifecycleRequest.safeParse({ action: "stop", service: "console" }).success).toBe(false);
  });
});
