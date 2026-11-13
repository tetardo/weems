import { describe, expect, it } from "vitest";
import { accountName, readProfileForm } from "./profile-form-data.ts";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  return data;
};

describe("settings form", () => {
  it("reads a published profile, cleaning case and blanks", () => {
    const read = readProfileForm(
      form({
        isPublic: "on",
        consent: "on",
        showLiveFlights: "on",
        handle: " Greg-FR ",
        homeIcao: "lfbo",
        country: "FR",
        vatsimId: "",
      }),
    );
    expect(read).toEqual({
      ok: true,
      update: {
        isPublic: true,
        showLiveFlights: true,
        handle: "greg-fr",
        country: "FR",
        homeIcao: "LFBO",
        level: null,
        vatsimId: null,
        ivaoId: null,
        instagram: null,
        facebook: null,
        simbriefId: null,
      },
    });
  });

  it("reads « Montrer mes vols en cours » off on a public page, on while the page is off", () => {
    const read = (fields: Record<string, string>) => {
      const result = readProfileForm(form({ handle: "greg-fr", ...fields }));
      return result.ok ? result.update.showLiveFlights : null;
    };
    expect(read({ isPublic: "on", consent: "on" })).toBe(false);
    expect(read({ isPublic: "on", consent: "on", showLiveFlights: "on" })).toBe(true);
    expect(read({})).toBe(true);
  });

  it("needs the consent box to publish", () => {
    expect(readProfileForm(form({ isPublic: "on", handle: "greg-fr" }))).toEqual({
      ok: false,
      field: "consent",
    });
  });

  it("names the wrong field", () => {
    expect(readProfileForm(form({ vatsimId: "12" }))).toEqual({ ok: false, field: "vatsimId" });
    expect(readProfileForm(form({ handle: "-x" }))).toEqual({ ok: false, field: "handle" });
  });

  it("needs an address to publish", () => {
    expect(readProfileForm(form({ isPublic: "on", consent: "on" }))).toEqual({
      ok: false,
      field: "handle",
    });
  });

  it("names a wrong country or level", () => {
    expect(readProfileForm(form({ handle: "greg-fr", country: "fr" }))).toEqual({
      ok: false,
      field: "country",
    });
    expect(readProfileForm(form({ handle: "greg-fr", level: "ace" }))).toEqual({
      ok: false,
      field: "level",
    });
  });

  it("keeps the account name of a typed @name or a pasted profile link", () => {
    expect(accountName("@greg.flies")).toBe("greg.flies");
    expect(accountName("https://www.instagram.com/greg.flies/?hl=fr")).toBe("greg.flies");
    expect(accountName("instagram.com/greg_flies")).toBe("greg_flies");
    expect(accountName("https://m.facebook.com/greg.dupont")).toBe("greg.dupont");
    expect(accountName("https://www.facebook.com/profile.php?id=100012345678")).toBe(
      "100012345678",
    );
    expect(accountName(null)).toBeNull();
  });

  it("names a wrong social account", () => {
    expect(
      readProfileForm(form({ handle: "greg-fr", instagram: "https://evil.example/x y" })),
    ).toEqual({ ok: false, field: "instagram" });
  });
});
