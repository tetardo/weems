import { describe, expect, it } from "vitest";
import { readProfileForm } from "./profile-form-data.ts";

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
        handle: "greg-fr",
        country: "FR",
        homeIcao: "LFBO",
        level: null,
        vatsimId: null,
        ivaoId: null,
        simbriefId: null,
      },
    });
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
});
