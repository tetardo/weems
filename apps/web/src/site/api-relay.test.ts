import { describe, expect, it } from "vitest";
import { relayTarget } from "./api-relay.ts";

describe("addresses relayed to the API", () => {
  it("relays login routes, photos and address checks", () => {
    expect(relayTarget("/api/auth/get-session")).toBe("/api/auth/get-session");
    expect(relayTarget("/api/pilots/greg-fr/photo")).toBe("/v1/pilots/greg-fr/photo");
    expect(relayTarget("/api/me/profile/photo")).toBe("/v1/me/profile/photo");
    expect(relayTarget("/api/me/profile/handle-check")).toBe("/v1/me/profile/handle-check");
  });

  it("relays nothing else, and no handle that could change the path", () => {
    expect(relayTarget("/api/pilots/../me/photo")).toBeNull();
    expect(relayTarget("/api/pilots/Greg/photo")).toBeNull();
    expect(relayTarget("/api/me/profile")).toBeNull();
    expect(relayTarget("/fr/flights")).toBeNull();
  });
});
