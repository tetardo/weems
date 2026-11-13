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
    /** One account per pilot rank, Élève to Légende (pnpm populate create --no-careers if not). */
    careers: z.boolean(),
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
/** Flight hours the tracker threads and the API get through per second (measured: 9 on 4 cores). */
const HOURS_PER_S = 8;
/** Average time in the air of a hobby flight, all types (estimate of pnpm populate). */
const HOBBY_FLIGHT_H = 2;
/** The 9 careers of pnpm populate create, Élève to Légende: flights and hours, about. */
const CAREERS = { flights: 1600, hours: 5200 };
const RANKS = 9;

type PopulationSize = Pick<
  Extract<ActivityLaunch, { kind: "population" }>,
  "accounts" | "minFlights" | "maxFlights" | "careers"
>;

/** Accounts flying careers: the first 9 when asked. */
const careerAccounts = (launch: PopulationSize) =>
  launch.careers ? Math.min(RANKS, launch.accounts) : 0;

/** Average number of flights and flight hours a population will have. */
export function plannedFlights(launch: PopulationSize): { flights: number; hours: number } {
  const hobby = launch.accounts - careerAccounts(launch);
  const flights = Math.round((hobby * (launch.minFlights + launch.maxFlights)) / 2);
  const careers = careerAccounts(launch) === RANKS ? CAREERS : { flights: 0, hours: 0 };
  return {
    flights: flights + careers.flights,
    hours: Math.round(flights * HOBBY_FLIGHT_H + careers.hours),
  };
}

/** Seconds needed to fly them, for the estimate shown under the form. */
export const estimatedSeconds = (hours: number) => Math.ceil(hours / HOURS_PER_S);

/** Arguments of `pnpm`, run from the root of the repository. */
export function pnpmArgsOf(launch: ActivityLaunch, config: ConsoleConfig): string[] {
  const common = ["--api", config.apiUrl, "--token", config.devToken, "--progress"];
  if (launch.kind === "population") {
    return [
      ...["--filter", "@weems/tracker", "populate", "create"],
      ...["--accounts", String(launch.accounts)],
      ...["--flights", `${launch.minFlights}-${launch.maxFlights}`],
      ...["--days", String(launch.months * DAYS_PER_MONTH)],
      ...["--public", String(launch.publicPercent)],
      ...(launch.careers ? [] : ["--no-careers"]),
      ...common,
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
    const careers = launch.careers ? ", 9 grades" : "";
    return `Population fictive · ${launch.accounts} comptes, ${flights}, ${launch.months} mois${careers}`;
  }
  return `Activité en direct · ${launch.flights} vols, ${launch.visitors} visiteurs, ${launch.minutes} min`;
}
