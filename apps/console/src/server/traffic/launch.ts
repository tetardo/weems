import { join } from "node:path";
import { z } from "zod";
import type { ConsoleConfig } from "../console-config.ts";

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

/** Form « Pilotes simulés »: pnpm simulate. */
const SimulateLaunch = z.object({
  kind: z.literal("simulate"),
  count: int(1, 50),
  speed: int(1, 100),
  /** Simulated seconds between two departures. */
  stagger: int(0, 600),
});

/** Form « Test de charge »: pnpm load (spec J4 montée en charge). */
const LoadLaunch = z.object({
  kind: z.literal("load"),
  pilots: int(1, 2000),
  viewers: int(0, 5000),
  minutes: int(1, 120),
  speed: int(1, 100),
});

export const Launch = z.discriminatedUnion("kind", [SimulateLaunch, LoadLaunch]);
export type Launch = z.infer<typeof Launch>;

/** Arguments of `pnpm`, run from the root of the repository. */
export function pnpmArgsOf(launch: Launch, config: ConsoleConfig, reportFile: string): string[] {
  if (launch.kind === "simulate") {
    return [
      "--filter",
      "@weems/tracker",
      "simulate",
      ...["--count", String(launch.count), "--speed", String(launch.speed)],
      ...["--stagger", String(launch.stagger), "--api", config.apiUrl, "--progress"],
    ];
  }
  return [
    "load",
    ...["--pilots", String(launch.pilots), "--viewers", String(launch.viewers)],
    ...["--minutes", String(launch.minutes), "--speed", String(launch.speed)],
    ...["--api", config.apiUrl, "--out", reportFile],
  ];
}

/** Where the load test writes its detailed report, in the console's local folder. */
export const reportFileOf = (config: ConsoleConfig, id: string) =>
  join(config.dataDir, `load-${id}.json`);

/** One line for the history: « 10 pilotes · ×10 ». */
export function summaryOf(launch: Launch): string {
  if (launch.kind === "simulate") return `${launch.count} pilotes · ×${launch.speed}`;
  return `${launch.pilots} pilotes · ${launch.viewers} spect. · ${launch.minutes} min`;
}
