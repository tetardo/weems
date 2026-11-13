import type { AdminAmbassador } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { draftOf, emptyDraft, readDraft } from "./ambassador-draft.ts";

const NOW = Date.parse("2026-11-13T10:00:00.000Z");

const filled = () => ({
  ...emptyDraft(NOW),
  slug: "CaptainSim",
  name: "CaptainSim",
  tagline: "Streams MSFS tous les soirs",
  bioFr: "Pilote de ligne virtuel.",
  bioEn: "Virtual airline pilot.",
  code: "captainsim",
  links: { twitch: "https://twitch.tv/captainsim", youtube: "", website: "" },
});

describe("ambassador form", () => {
  it("starts with 3 months for 50 pilots, valid 90 days", () => {
    const draft = emptyDraft(NOW);
    expect([draft.months, draft.places, draft.expiresOn]).toEqual([3, 50, "2027-02-11"]);
  });

  it("reads the form into the API's format", () => {
    const read = readDraft(filled());
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.slug).toBe("captainsim");
    expect(read.settings.offer.code).toBe("CAPTAINSIM");
    expect(read.settings.offer.expiresAt).toBe("2027-02-11T23:59:59.000Z");
    expect(read.settings.links).toEqual([{ kind: "twitch", url: "https://twitch.tv/captainsim" }]);
    expect(read.settings.quoteFr).toBeNull();
  });

  it("names the field to correct", () => {
    expect(readDraft({ ...filled(), name: "" })).toEqual({
      ok: false,
      error: "Nom : valeur à corriger.",
    });
    expect(readDraft({ ...filled(), code: "WEEMS-ABCD" }).ok).toBe(false);
  });

  it("gives back a saved ambassador as it was typed", () => {
    const read = readDraft(filled());
    if (!read.ok) throw new Error(read.error);
    const saved: AdminAmbassador = {
      ...read.settings,
      slug: read.slug,
      hasPhoto: false,
      campaignId: "0190a1b2-c3d4-7000-8000-000000000001",
      used: 3,
      updatedAt: "2026-11-13T10:00:00.000Z",
    };
    expect(draftOf(saved)).toEqual({ ...filled(), slug: "captainsim", code: "CAPTAINSIM" });
  });
});
