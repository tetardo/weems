import type { BandMinute } from "@weems/contrats";
import { describe, expect, it } from "vitest";
import { configChanges } from "./config-changes.ts";

const at = (values: Partial<BandMinute["values"]>) =>
  ({ at: "", phase: null, values }) as BandMinute;

describe("configChanges", () => {
  it("lists gear, flaps and autopilot changes in flight order, AP OFF in amber", () => {
    const minutes = [
      at({ gear: 1, flaps: 1, autopilot: 0 }),
      at({ gear: 0.4, flaps: 0, autopilot: 0.8 }),
      at({ gear: 0, flaps: 0, autopilot: 1 }),
      at({ gear: null, flaps: 2, autopilot: 0.2 }),
      at({ gear: 1, flaps: 2, autopilot: 0 }),
    ];
    expect(configChanges(minutes)).toEqual([
      { minute: 1, code: "GEAR UP", amber: false },
      { minute: 1, code: "FLAPS 0", amber: false },
      { minute: 1, code: "AP ON", amber: false },
      { minute: 3, code: "FLAPS 2", amber: false },
      { minute: 3, code: "AP OFF", amber: true },
      { minute: 4, code: "GEAR DN", amber: false },
    ]);
  });

  it("finds nothing on a flight without these rows", () => {
    expect(configChanges([at({ altitude: 1000 }), at({ altitude: 2000 })])).toEqual([]);
  });
});
