import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { flightValidity } from "./validity.ts";

const HOUR = 3600;

describe("flightValidity", () => {
  it("accepts a real flight of 15 min in the air over 20 NM", () => {
    expect(flightValidity(publicFlight({ blockS: 600 + 15 * 60 }), 20)).toBe("valid");
  });

  it("refuses an easy fake, with the reason", () => {
    const replay = { ...publicFlight(), simulator: "replay" as const };
    expect(flightValidity(replay, 100)).toBe("simulated");
    expect(flightValidity(publicFlight({ blockS: null }), 100)).toBe("noTakeoffOrLanding");
    expect(flightValidity(publicFlight({ extra: ["slew"] }), 100)).toBe("moved");
    expect(flightValidity(publicFlight({ extra: ["positionChanged"] }), 100)).toBe("moved");
    expect(flightValidity(publicFlight({ extra: ["crashed"] }), 100)).toBe("crashed");
    expect(flightValidity(publicFlight({ blockS: 600 + 14 * 60 }), 100)).toBe("tooShort");
    expect(flightValidity(publicFlight({ blockS: HOUR }), 19.9)).toBe("tooShortDistance");
    expect(flightValidity(publicFlight({ blockS: HOUR }), null)).toBe("tooShortDistance");
  });
});
