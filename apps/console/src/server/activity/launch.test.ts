import { describe, expect, it } from "vitest";
import type { ConsoleConfig } from "../console-config.ts";
import { ActivityLaunch, estimatedSeconds, plannedFlights, pnpmArgsOf } from "./launch.ts";

const config = { apiUrl: "http://localhost:3000", devToken: "dev-token" } as ConsoleConfig;
const population = {
  kind: "population",
  accounts: 50,
  minFlights: 5,
  maxFlights: 40,
  months: 6,
  publicPercent: 75,
  careers: true,
} as const;

describe("population launch", () => {
  it("asks for the 9 careers by default, and skips them with --no-careers", () => {
    const launch = ActivityLaunch.parse(population);
    expect(pnpmArgsOf(launch, config)).not.toContain("--no-careers");
    const without = ActivityLaunch.parse({ ...population, careers: false });
    expect(pnpmArgsOf(without, config)).toContain("--no-careers");
  });

  it("counts the careers' thousands of hours in the estimate", () => {
    const withCareers = plannedFlights(population);
    const hobby = plannedFlights({ ...population, careers: false });
    expect(withCareers.hours).toBeGreaterThan(hobby.hours + 4000);
    expect(estimatedSeconds(withCareers.hours)).toBeGreaterThan(estimatedSeconds(hobby.hours));
  });
});
