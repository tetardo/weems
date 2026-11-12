import { describe, expect, it } from "vitest";
import { publicFlight } from "../../testing/public-flights.ts";
import { logbookEntry } from "./entries.ts";

describe("verdict of a flight", () => {
  it("reads the final landing", () => {
    expect(logbookEntry(publicFlight({ vs: -120 })).verdict).toBe("clean");
    expect(logbookEntry(publicFlight({ vs: -320 })).verdict).toBe("firm");
    expect(logbookEntry(publicFlight({ extra: ["bounce"] })).verdict).toBe("bounce");
  });

  it("puts alerts before everything", () => {
    const flight = publicFlight({ vs: -100 });
    flight.summary.alerts = ["slew"];
    expect(logbookEntry(flight).verdict).toBe("nonCompliant");
  });
});
