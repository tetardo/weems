import { describe, expect, it } from "vitest";
import type { FlightEvent } from "../api/flights.ts";
import { landingSummary } from "./landing-summary.ts";

let seq = 0;
function event(
  minute: number,
  type: FlightEvent["type"],
  context: Record<string, unknown> = {},
): FlightEvent {
  return {
    seq: ++seq,
    at: new Date(Date.UTC(2026, 10, 11, 8, minute)).toISOString(),
    type,
    context,
  };
}

describe("landing summary", () => {
  it("keeps the final landing after a go-around, and counts its bounces", () => {
    const events = [
      event(50, "touchdown", { vs: -900 }),
      event(51, "goAround"),
      event(60, "touchdown", { vs: -180.4 }),
      event(60, "bounce"),
      event(61, "touchdown", { vs: -60 }),
    ];
    expect(landingSummary(events)).toEqual({
      touchdownVs: -180.4,
      bounces: 1,
      touchdowns: 3,
      goArounds: 1,
    });
  });

  it("is null without touchdown, and the rate unknown when not measured", () => {
    expect(landingSummary([event(1, "paused")])).toBeNull();
    expect(landingSummary([event(1, "touchdown")])?.touchdownVs).toBeNull();
  });
});
