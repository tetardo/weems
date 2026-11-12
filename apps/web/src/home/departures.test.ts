import { describe, expect, it } from "vitest";
import { liveFlight } from "../live/testing/live-flight.ts";
import { boardRows, flapDigits, levelOf, phaseGroup } from "./departures.ts";

describe("home departures board", () => {
  it("groups the 12 phases into 5 labels", () => {
    expect(phaseGroup("TAXI_OUT")).toBe("ground");
    expect(phaseGroup("TAKEOFF")).toBe("climb");
    expect(phaseGroup("CRUISE")).toBe("cruise");
    expect(phaseGroup("DESCENT")).toBe("descent");
    expect(phaseGroup("FINAL")).toBe("approach");
    expect(phaseGroup("ARRIVED")).toBe("ground");
  });

  it("shows a flight level from 10 000 ft, feet below, and the ground", () => {
    expect(levelOf({ altMsl: 35_012, onGround: false })).toEqual({
      kind: "flightLevel",
      value: "FL350",
    });
    expect(levelOf({ altMsl: 10_000, onGround: false })).toEqual({
      kind: "flightLevel",
      value: "FL100",
    });
    expect(levelOf({ altMsl: 4_480, onGround: false })).toEqual({ kind: "feet", value: 4_500 });
    expect(levelOf({ altMsl: 420, onGround: true })).toEqual({ kind: "ground" });
  });

  it("keeps the 5 flights heard from last, without lost signals", () => {
    const flights = new Map(
      Array.from({ length: 7 }, (_, i) => {
        const id = `f${i}`;
        const receivedAt = `2026-11-11T08:00:0${i}.000Z`;
        return [id, liveFlight(id, { receivedAt, signal: i === 6 ? "lost" : "ok" })] as const;
      }),
    );
    const rows = boardRows(flights);
    expect(rows.map((row) => row.flightId)).toEqual(["f5", "f4", "f3", "f2", "f1"]);
    expect(rows[0]).toMatchObject({
      callsign: "WMS101",
      from: "LFLL",
      to: "LFMN",
      phase: "cruise",
    });
  });

  it("pads a counter with dimmed zeros", () => {
    expect(flapDigits(128, 4)).toEqual([
      { digit: "0", padding: true },
      { digit: "1", padding: false },
      { digit: "2", padding: false },
      { digit: "8", padding: false },
    ]);
    expect(
      flapDigits(12_345, 3)
        .map((d) => d.digit)
        .join(""),
    ).toBe("12345");
  });
});
