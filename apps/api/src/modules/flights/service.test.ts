import { describe, expect, it } from "vitest";
import type { FlightEvent } from "@weems/contrats";
import { lastPhaseOf } from "./service.ts";

const event = (seq: number, type: FlightEvent["type"], context = {}): FlightEvent => ({
  seq,
  at: "2026-11-11T08:00:00.000Z",
  type,
  context,
});

describe("lastPhaseOf", () => {
  it("is null before any phase change", () => {
    expect(lastPhaseOf([event(1, "paused")])).toBeNull();
  });

  it("takes the most recent phase change, ignoring other events", () => {
    const events = [
      event(1, "phaseChanged", { to: "CLIMB" }),
      event(2, "phaseChanged", { to: "CRUISE" }),
      event(3, "paused"),
    ];
    expect(lastPhaseOf(events)).toBe("CRUISE");
  });

  it("skips a phase change whose target is not a known phase", () => {
    const events = [
      event(1, "phaseChanged", { to: "CLIMB" }),
      event(2, "phaseChanged", { to: "?" }),
    ];
    expect(lastPhaseOf(events)).toBe("CLIMB");
  });
});
