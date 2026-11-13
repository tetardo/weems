import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { founderFlight, progressOf } from "./flight-check.ts";

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
