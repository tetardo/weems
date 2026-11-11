import { describe, expect, it } from "vitest";
import { SystemEventFilter } from "./system-events.ts";

describe("system events", () => {
  it("translates one-off events directly", () => {
    const filter = new SystemEventFilter();
    expect(filter.translate("Crashed", 0, 10)).toEqual({ t: 10, type: "crashed" });
    expect(filter.translate("PositionChanged", 0, 11)).toEqual({ t: 11, type: "positionChanged" });
    expect(filter.translate("AircraftLoaded", 0, 12)).toEqual({ t: 12, type: "aircraftLoaded" });
    expect(filter.translate("FlightLoaded", 0, 13)).toEqual({ t: 13, type: "flightLoaded" });
  });

  it("drops the extra SimStart/SimStop pairs of MSFS 2024 (pieges.md)", () => {
    const filter = new SystemEventFilter();
    const types = [
      filter.translate("SimStart", 0, 1),
      filter.translate("SimStart", 0, 2),
      filter.translate("SimStop", 0, 3),
      filter.translate("SimStop", 0, 4),
      filter.translate("SimStart", 0, 5),
    ].map((e) => e?.type ?? null);
    expect(types).toEqual(["simStarted", null, "simStopped", null, "simStarted"]);
  });

  it("follows the pause from the Pause_EX1 flags, without repeats", () => {
    const filter = new SystemEventFilter();
    expect(filter.paused).toBe(false);
    expect(filter.translate("Pause_EX1", 4, 1)).toEqual({ t: 1, type: "paused" });
    expect(filter.paused).toBe(true);
    expect(filter.translate("Pause_EX1", 1, 2)).toBeNull(); // another pause kind, still paused
    expect(filter.translate("Pause_EX1", 0, 3)).toEqual({ t: 3, type: "unpaused" });
    expect(filter.translate("Pause_EX1", 0, 4)).toBeNull();
  });
});
