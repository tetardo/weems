import { describe, expect, it } from "vitest";
import { isLocalScriptRequest, LOCAL_SCRIPT_HEADER, parseAction } from "./lifecycle.ts";

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

describe("parseAction", () => {
  it("reads the two actions", () => {
    expect(parseAction({ action: "start-all" })).toBe("start-all");
    expect(parseAction({ action: "stop-all" })).toBe("stop-all");
  });

  it("refuses anything else", () => {
    expect(parseAction(null)).toBeNull();
    expect(parseAction("stop-all")).toBeNull();
    expect(parseAction({ action: "delete" })).toBeNull();
  });
});
