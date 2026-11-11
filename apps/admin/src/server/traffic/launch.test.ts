import { describe, expect, it } from "vitest";
import { consoleConfig } from "../console-config.ts";
import { Launch, pnpmArgsOf, summaryOf } from "./launch.ts";

const config = consoleConfig({ WEEMS_REPO_ROOT: "/repo", WEEMS_API_URL: "http://localhost:3000" });

describe("launch", () => {
  it("builds pnpm simulate with the progress lines", () => {
    const launch = Launch.parse({ kind: "simulate", count: "10", speed: "10", stagger: "30" });
    expect(pnpmArgsOf(launch, config, "")).toEqual([
      "--filter",
      "@weems/tracker",
      "simulate",
      "--count",
      "10",
      "--speed",
      "10",
      "--stagger",
      "30",
      "--api",
      "http://localhost:3000",
      "--progress",
    ]);
    expect(summaryOf(launch)).toBe("10 pilotes · ×10");
  });

  it("builds pnpm load with its report file", () => {
    const launch = Launch.parse({ kind: "load", pilots: 50, viewers: 100, minutes: 30, speed: 1 });
    expect(pnpmArgsOf(launch, config, "/repo/apps/admin/.data/load-1.json")).toEqual([
      "load",
      "--pilots",
      "50",
      "--viewers",
      "100",
      "--minutes",
      "30",
      "--speed",
      "1",
      "--api",
      "http://localhost:3000",
      "--out",
      "/repo/apps/admin/.data/load-1.json",
    ]);
  });

  it("refuses values out of range", () => {
    expect(Launch.safeParse({ kind: "simulate", count: 0, speed: 10, stagger: 30 }).success).toBe(
      false,
    );
    expect(
      Launch.safeParse({ kind: "load", pilots: 50, viewers: 100, minutes: 999, speed: 1 }).success,
    ).toBe(false);
  });
});
