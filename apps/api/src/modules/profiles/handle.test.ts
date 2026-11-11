import { PilotHandle } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { isReservedHandle, suggestHandle } from "./handle.ts";

const ID = "01970000-0000-7000-8000-00000000abcd";

describe("handle of a public profile", () => {
  it("is proposed from the pilot's name, without accents or symbols", () => {
    expect(suggestHandle("Grég  FR !", ID)).toBe("greg-fr");
    expect(suggestHandle("Jean-Émile Dupont de la Fontaine du Lac", ID)).toBe(
      "jean-emile-dupont-de-la",
    );
  });

  it("falls back on a unique name when the pilot's name is too short or reserved", () => {
    expect(suggestHandle("é", ID)).toBe("pilot-abcd");
    expect(suggestHandle("Weems", ID)).toBe("weems-abcd");
    expect(isReservedHandle("admin")).toBe(true);
  });

  it("always proposes a valid handle", () => {
    for (const name of ["Greg-FR", "--x--", "ÆØÅ", "a".repeat(80), "Weems"]) {
      expect(PilotHandle.safeParse(suggestHandle(name, ID)).success).toBe(true);
    }
  });
});
