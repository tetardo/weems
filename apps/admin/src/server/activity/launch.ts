import { z } from "zod";
import type { ConsoleConfig } from "../console-config.ts";

const int = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

/** Block « Population fictive »: pnpm populate create (replaces the previous population). */
const PopulationLaunch = z
  .object({
    kind: z.literal("population"),
    accounts: int(1, 500),
    minFlights: int(1, 200),
    maxFlights: int(1, 200),
    months: z.union([z.literal(1), z.literal(6), z.literal(12)]),
    publicPercent: int(0, 100),
  })
  .refine((launch) => launch.minFlights <= launch.maxFlights, {
    message: "Le nombre de vols minimal dépasse le maximal.",
  });

/** Block « Activité en direct »: pnpm populate live. */
const LiveLaunch = z.object({
  kind: z.literal("live"),
  flights: int(1, 200),
  visitors: int(0, 5000),
  minutes: int(1, 240),
  speed: z.union([z.literal(1), z.literal(10), z.literal(50)]),
});

export const ActivityLaunch = z.union([PopulationLaunch, LiveLaunch]);
export type ActivityLaunch = z.infer<typeof ActivityLaunch>;

const DAYS_PER_MONTH = 30;
/** Flights the API takes in per second on a Mac (measured: about 2 to 3). */
const FLIGHTS_PER_S = 2.5;

/** Average number of flights a population will have. */
export function plannedFlights(launch: {
  accounts: number;
  minFlights: number;
  maxFlights: number;
}) {
  return Math.round((launch.accounts * (launch.minFlights + launch.maxFlights)) / 2);
}

/** Seconds needed to fly them, for the estimate shown under the form. */
export const estimatedSeconds = (flights: number) => Math.ceil(flights / FLIGHTS_PER_S);

/** Arguments of `pnpm`, run from the root of the repository. */
export function pnpmArgsOf(launch: ActivityLaunch, config: ConsoleConfig): string[] {
  const common = ["--api", config.apiUrl, "--token", config.devToken, "--progress"];
  if (launch.kind === "population") {
    return [
      ...["--filter", "@weems/tracker", "populate", "create"],
      ...["--accounts", String(launch.accounts)],
      ...["--flights", `${launch.minFlights}-${launch.maxFlights}`],
      ...["--days", String(launch.months * DAYS_PER_MONTH)],
      ...["--public", String(launch.publicPercent), ...common],
    ];
  }
  return [
    ...["--filter", "@weems/tracker", "populate", "live"],
    ...["--flights", String(launch.flights), "--visitors", String(launch.visitors)],
    ...["--minutes", String(launch.minutes), "--speed", String(launch.speed), ...common],
  ];
}

/** Title of the run: « Population fictive · 50 comptes, 5 à 40 vols, 6 mois ». */
export function summaryOf(launch: ActivityLaunch): string {
  if (launch.kind === "population") {
    const flights =
      launch.minFlights === launch.maxFlights
        ? `${launch.minFlights} vols`
        : `${launch.minFlights} à ${launch.maxFlights} vols`;
    return `Population fictive · ${launch.accounts} comptes, ${flights}, ${launch.months} mois`;
  }
  return `Activité en direct · ${launch.flights} vols, ${launch.visitors} visiteurs, ${launch.minutes} min`;
}
