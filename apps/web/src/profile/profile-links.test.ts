import { describe, expect, it } from "vitest";
import { logbookLinks, publicProfileLinks } from "./profile-links.ts";

describe("profile links", () => {
  it("points a public profile to its public photo and flights", () => {
    const links = publicProfileLinks("greg-fr");
    expect(links.photo).toBe("/api/pilots/greg-fr/photo");
    expect(links.flight("f1")).toBe("/pilots/greg-fr/flights/f1");
    expect(links.share).toBe("/pilots/greg-fr");
  });

  it("points the logbook to the pilot's own photo and flight pages", () => {
    const links = logbookLinks(null);
    expect(links.photo).toBe("/api/me/profile/photo");
    expect(links.page).toBe("/logbook/public");
    expect(links.flight("f1")).toBe("/logbook/flights/f1/full");
    expect(links.share).toBeNull();
    expect(logbookLinks("greg-fr").share).toBe("/pilots/greg-fr");
  });
});
