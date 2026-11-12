import { describe, expect, it } from "vitest";
import { phaseChangeOf, touchdownVsOf } from "./event-context.ts";

describe("phaseChangeOf", () => {
  it("reads the phase change written by the tracker", () => {
    const event = { type: "phaseChanged", context: { from: "TAKEOFF", to: "CLIMB" } };
    expect(phaseChangeOf(event)).toEqual({ from: "TAKEOFF", to: "CLIMB" });
  });

  it("keeps the air start marker of a flight opened in the air", () => {
    const event = { type: "phaseChanged", context: { from: null, to: "CRUISE", airStart: true } };
    expect(phaseChangeOf(event)).toEqual({ from: null, to: "CRUISE", airStart: true });
  });

  it("returns null for another event type or an unknown phase", () => {
    expect(phaseChangeOf({ type: "touchdown", context: { to: "CLIMB" } })).toBeNull();
    expect(phaseChangeOf({ type: "phaseChanged", context: { to: "HOVER" } })).toBeNull();
  });
});

describe("touchdownVsOf", () => {
  it("reads the vertical speed at touchdown", () => {
    expect(touchdownVsOf({ type: "touchdown", context: { vs: -180 } })).toBe(-180);
  });

  it("returns null when not measured or for another event type", () => {
    expect(touchdownVsOf({ type: "touchdown", context: {} })).toBeNull();
    expect(touchdownVsOf({ type: "bounce", context: { vs: -180 } })).toBeNull();
  });
});
