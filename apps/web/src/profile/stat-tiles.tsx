import type { PilotStats } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { InfoTip } from "../ui/info-tip.tsx";

interface Tile {
  key: string;
  value: string;
  sub: string;
  good?: boolean;
}

/** One stat tile: label, big value, detail line, help bubble. */
function StatTile({ tile }: { tile: Tile }) {
  const t = useTranslations("Profile.stats");
  const help = useTranslations("Profile.help");
  return (
    <div className="relative rounded-2xl border border-line bg-surface px-4.5 py-4">
      <div className="pr-6 text-[13px] text-muted">{t(`${tile.key}.label`)}</div>
      <div className={`mt-0.5 font-title text-[28px] ${tile.good ? "text-success" : ""}`}>
        {tile.value}
      </div>
      <div className="text-[12.5px] text-muted">{tile.sub}</div>
      <InfoTip text={help(tile.key)} label={help("label")} />
    </div>
  );
}

const NONE = "—";

/** Formatting helpers of the tiles, so that each group below stays a plain list. */
interface Tools {
  t: (key: string, values?: Record<string, string | number>) => string;
  number: (value: number) => string;
  percent: (part: number, whole: number) => string | null;
  duration: (seconds: number | null) => string;
  date: (iso: string) => string;
}

/** Flights, hours, day and night, longest flight, streak. */
function volumeTiles(stats: PilotStats, { t, number, percent, duration }: Tools): Tile[] {
  const { longestFlight: longest, dayS, nightS, streak } = stats;
  const night = percent(nightS, dayS + nightS);
  return [
    { key: "flights", value: number(stats.flights), sub: "" },
    {
      key: "hours",
      value: duration(stats.airborneS),
      sub: t("hours.block", { block: duration(stats.blockS) }),
    },
    {
      key: "dayNight",
      value: `${duration(dayS)} · ${duration(nightS)}`,
      sub: night ? t("dayNight.sub", { night }) : NONE,
    },
    {
      key: "longest",
      value: duration(longest?.blockS ?? null),
      sub: longest ? formatRoute(longest.departureIcao, longest.arrivalIcao) : NONE,
    },
    {
      key: "streak",
      value: t("streak.value", { weeks: streak.currentWeeks }),
      sub: t("streak.sub", { weeks: streak.recordWeeks }),
    },
  ];
}

/** Airports, aircraft, clean landings, average and best touchdown. */
function placeAndLandingTiles(stats: PilotStats, { t, number, percent, date }: Tools): Tile[] {
  const { cleanLandings: clean, bestLanding: best, averageTouchdownVs: average } = stats;
  const favorite = stats.favoriteAircraft;
  return [
    { key: "airports", value: number(stats.airports), sub: "" },
    {
      key: "aircraft",
      value: number(stats.aircraft),
      sub: favorite ? t("aircraft.sub", { name: favorite }) : "",
    },
    {
      key: "clean",
      value: percent(clean.clean, clean.landings) ?? NONE,
      sub: t("clean.sub", clean),
    },
    {
      key: "average",
      value: average === null ? NONE : number(Math.round(average)),
      sub: t("average.sub", { goArounds: stats.goArounds }),
    },
    best
      ? {
          key: "best",
          value: number(best.touchdownVs),
          sub: t("best.sub", { airport: best.airportIcao ?? NONE, date: date(best.at) }),
          good: true,
        }
      : { key: "best", value: NONE, sub: "" },
  ];
}

/** The ten tiles, in reading order (spec J4): volume first, then places, aircraft and landings. */
function useTiles(stats: PilotStats): Tile[] {
  const t = useTranslations("Profile.stats");
  const format = useFormatter();
  const tools: Tools = {
    t,
    number: (value) => format.number(value),
    percent: (part, whole) =>
      whole === 0 ? null : format.number(part / whole, { style: "percent" }),
    duration: (seconds) => formatDuration(seconds) ?? NONE,
    date: (iso) => format.dateTime(new Date(iso), { dateStyle: "short" }),
  };
  return [...volumeTiles(stats, tools), ...placeAndLandingTiles(stats, tools)];
}

/** Stat tiles of a public profile: five per row on a wide screen, two on a phone. */
export function StatTiles({ stats }: { stats: PilotStats }) {
  const tiles = useTiles(stats);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((tile) => (
        <StatTile key={tile.key} tile={tile} />
      ))}
    </div>
  );
}
