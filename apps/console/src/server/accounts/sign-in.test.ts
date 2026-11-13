import { describe, expect, it } from "vitest";
import { cookieHeaderOf } from "./sign-in.ts";

describe("cookieHeaderOf", () => {
  it("keeps the name=value pairs only", () => {
    expect(
      cookieHeaderOf([
        "better-auth.session_token=abc.def; Path=/; HttpOnly; SameSite=Lax",
        "better-auth.session_data=xyz; Max-Age=300",
        "broken",
      ]),
    ).toBe("better-auth.session_token=abc.def; better-auth.session_data=xyz");
  });
});
