import type { LivePilot } from "@weems/contrats";
import { beforeEach, describe, expect, it } from "vitest";
import { LivePilots, REFRESH_EVERY_MS } from "./live-pilots.ts";

const camille: LivePilot = {
  handle: "camille-r",
  name: "Camille Roux",
  country: "FR",
  hasPhoto: true,
};

let now: number;
let publicPilots: Map<string, LivePilot>;
let reads: string[][];
let pilots: LivePilots;
beforeEach(() => {
  now = 0;
  publicPilots = new Map([["a", camille]]);
  reads = [];
  pilots = new LivePilots(
    (ids) => {
      reads.push(ids);
      return Promise.resolve(publicPilots);
    },
    () => now,
  );
});

describe("live pilots", () => {
  it("reads new pilots at once; a private one stays anonymous", async () => {
    expect(await pilots.refresh(["a", "b", "a"])).toEqual(new Set(["a"]));
    expect(pilots.of("a")).toEqual(camille);
    expect(pilots.of("b")).toBeNull();
    expect(reads).toEqual([["a", "b"]]);
  });

  it("does not read known pilots again before the refresh delay", async () => {
    await pilots.refresh(["a"]);
    now += REFRESH_EVERY_MS - 1;
    expect(await pilots.refresh(["a"])).toEqual(new Set());
    await pilots.refresh(["a", "c"]);
    expect(reads).toEqual([["a"], ["c"]]);
  });

  it("drops a pilot who turned the profile off at the next refresh", async () => {
    await pilots.refresh(["a"]);
    publicPilots = new Map();
    now += REFRESH_EVERY_MS;
    expect(await pilots.refresh(["a"])).toEqual(new Set(["a"]));
    expect(pilots.of("a")).toBeNull();
  });

  it("forgets the pilots no longer on the map", async () => {
    await pilots.refresh(["a"]);
    now += REFRESH_EVERY_MS;
    await pilots.refresh([]);
    expect(pilots.of("a")).toBeNull();
  });
});
