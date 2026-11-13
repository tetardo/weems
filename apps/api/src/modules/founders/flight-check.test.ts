import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { checkFlight, founderFlight, progressOf } from "./flight-check.ts";

const HOUR = 3600;

describe("checkFlight", () => {
  it("accepts a real flight of 15 min in the air over 20 NM", () => {
    expect(checkFlight(publicFlight({ blockS: 600 + 15 * 60 }), 20)).toBe("valid");
  });

  it("refuses what the founder offer does not count, with the reason", () => {
    const replay = { ...publicFlight(), simulator: "replay" as const };
    expect(checkFlight(replay, 100)).toBe("simulated");
    expect(checkFlight(publicFlight({ blockS: null }), 100)).toBe("noTakeoffOrLanding");
    expect(checkFlight(publicFlight({ extra: ["slew"] }), 100)).toBe("moved");
    expect(checkFlight(publicFlight({ extra: ["positionChanged"] }), 100)).toBe("moved");
    expect(checkFlight(publicFlight({ extra: ["crashed"] }), 100)).toBe("crashed");
    expect(checkFlight(publicFlight({ blockS: 600 + 14 * 60 }), 100)).toBe("tooShort");
    expect(checkFlight(publicFlight({ blockS: HOUR }), 19.9)).toBe("tooShortDistance");
    expect(checkFlight(publicFlight({ blockS: HOUR }), null)).toBe("tooShortDistance");
  });
});

describe("progressOf", () => {
  const valid = (at: string) => founderFlight(publicFlight({ at }), 120);

  it("needs 3 valid flights on 2 UTC days at least", () => {
    const sameDay = [
      "2026-11-11T08:00:00.000Z",
      "2026-11-11T12:00:00.000Z",
      "2026-11-11T23:00:00.000Z",
    ];
    expect(progressOf(sameDay.map(valid))).toEqual({
      validFlights: 3,
      validDays: 1,
      qualified: false,
    });
    const twoDays = [...sameDay.slice(0, 2), "2026-11-12T00:30:00.000Z"];
    expect(progressOf(twoDays.map(valid))).toEqual({
      validFlights: 3,
      validDays: 2,
      qualified: true,
    });
  });

  it("does not count the refused flights", () => {
    const short = founderFlight(publicFlight({ at: "2026-11-12T08:00:00.000Z" }), 5);
    const flights = [valid("2026-11-11T08:00:00.000Z"), valid("2026-11-11T09:00:00.000Z"), short];
    expect(progressOf(flights)).toEqual({ validFlights: 2, validDays: 1, qualified: false });
  });
});
