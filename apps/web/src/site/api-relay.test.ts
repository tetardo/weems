import { describe, expect, it } from "vitest";
import { ownPhotoSrc, relayTarget } from "./api-relay.ts";

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

describe("address of the pilot's own photo", () => {
  it("changes with each new photo, and is null without photo", () => {
    expect(ownPhotoSrc(null)).toBeNull();
    const first = ownPhotoSrc("2026-11-12T03:00:00.000Z");
    expect(first).toBe("/api/me/profile/photo?v=1794452400000");
    expect(ownPhotoSrc("2026-11-12T03:00:00.001Z")).not.toBe(first);
  });
});
