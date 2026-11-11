import { describe, expect, it } from "vitest";
import { applyUpdate, fromSnapshot } from "./flights-store.ts";
import { liveFlight } from "./testing/live-flight.ts";

describe("flights store", () => {
  it("indexes the snapshot by flight id", () => {
    const flights = fromSnapshot({ flights: [liveFlight("a"), liveFlight("b")] });
    expect([...flights.keys()]).toEqual(["a", "b"]);
  });

  it("adds, replaces and removes flights from an update without changing the previous map", () => {
    const before = fromSnapshot({ flights: [liveFlight("a"), liveFlight("b")] });
    const moved = liveFlight("a", { signal: "lost" });
    const after = applyUpdate(before, { flights: [moved, liveFlight("c")], removed: ["b"] });
    expect([...after.keys()]).toEqual(["a", "c"]);
    expect(after.get("a")).toBe(moved);
    expect(before.has("b")).toBe(true);
  });
});
