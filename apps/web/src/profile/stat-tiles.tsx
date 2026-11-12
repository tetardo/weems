import type { AircraftCategory, PilotStats } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { CategoryDot } from "../aircraft/category-dot.tsx";
import { formatDuration, formatRoute } from "../format/flight-format.ts";
import { InfoTip } from "../ui/info-tip.tsx";

/** One line of a tile detailed by aircraft category. */
interface CategoryLine {
  category: AircraftCategory;
  value: string;
  note?: string;
}

interface Tile {
  key: string;
  /** No big value: the tile is only its lines by category. */
  value?: string;
  sub: string;
  good?: boolean;
  byCategory?: CategoryLine[];
}

/** Detail of a tile, one line per flown category. */
function CategoryLines({ lines, good }: { lines: readonly CategoryLine[]; good: boolean }) {
  const categories = useTranslations("Aircraft.categories");
  return (
    <ul className="m-0 mt-2.5 grid list-none gap-1 border-t border-line p-0 pt-2 text-[13px]">
      {lines.map(({ category, value, note }) => (
        <li key={category} className="flex flex-wrap items-center gap-x-2">
          <CategoryDot category={category} />
          <span>{categories(category)}</span>
          <b className={`ml-auto font-semibold tabular-nums ${good ? "text-success" : ""}`}>
            {value}
          </b>
          {note && <small className="w-full pl-4.5 text-xs text-muted">{note}</small>}
        </li>
      ))}
    </ul>
  );
}

/** One stat tile: label, big value, detail line, lines by category, help bubble. */
function StatTile({ tile }: { tile: Tile }) {
  const t = useTranslations("Profile.stats");
  const help = useTranslations("Profile.help");
  const good = tile.good ?? false;
  return (
    <div className="relative rounded-panel border border-line bg-surface px-4.5 py-4">
      <div className="pr-6 text-[13px] text-muted">{t(`${tile.key}.label`)}</div>
      {tile.value !== undefined && (
        <div className={`mt-0.5 font-title text-[28px] ${good ? "text-success" : ""}`}>
          {tile.value}
        </div>
      )}
      <div className="text-[12.5px] text-muted">{tile.sub}</div>
      {tile.byCategory && tile.byCategory.length > 0 && (
        <CategoryLines lines={tile.byCategory} good={good} />
      )}
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

/**
 * Average touchdown, overall and by category, and best landing of each category (spec J4,
 * aircraft categories: one record for all aircraft favoured the light ones).
 */
function touchdownTiles(stats: PilotStats, { t, number, date }: Tools): Tile[] {
  const average = stats.averageTouchdownVs;
  const lines = stats.experience.categories;
  const best = lines.flatMap(({ category, bestLanding: landing }) =>
    landing
      ? [
          {
            category,
            value: number(landing.touchdownVs),
            note: `${landing.airportIcao ?? NONE}, ${date(landing.at)}`,
          },
        ]
      : [],
  );
  return [
    {
      key: "average",
      value: average === null ? NONE : number(Math.round(average)),
      sub: t("average.sub", { goArounds: stats.goArounds }),
      byCategory: lines.flatMap(({ category, averageTouchdownVs: vs }) =>
        vs === null ? [] : [{ category, value: number(Math.round(vs)) }],
      ),
    },
    { key: "best", sub: best.length > 0 ? t("best.sub") : NONE, byCategory: best, good: true },
  ];
}

/** Airports, aircraft, clean landings. */
function placeAndLandingTiles(stats: PilotStats, { t, number, percent }: Tools): Tile[] {
  const clean = stats.cleanLandings;
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
  return [
    ...volumeTiles(stats, tools),
    ...placeAndLandingTiles(stats, tools),
    ...touchdownTiles(stats, tools),
  ];
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
