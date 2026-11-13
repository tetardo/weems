import type { PositionReport } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { flightLevel, formatDuration } from "../format/flight-format.ts";
import type { RouteProgress } from "../live/route-progress.ts";

/** Vertical speed under which the aircraft is said level, ft/min. */
const LEVEL_FPM = 100;

/** One figure, with its unit and a note under it; the first one highlighted. */
function Tile(props: { label: string; value: string; unit: string; note: string; first: boolean }) {
  const { label, value, unit, note, first } = props;
  return (
    <div
      className={`rounded-box border px-3 py-2 ${first ? "border-accent/40 bg-accent/12" : "border-line bg-bg/40"}`}
    >
      <dt className="text-[11.5px] text-muted">{label}</dt>
      <dd className={`m-0 font-title text-[20px] font-bold ${first ? "text-accent" : ""}`}>
        {value}
        {unit && <span className="ml-1 font-sans text-[12px] font-medium text-muted">{unit}</span>}
        {note && <span className="block font-sans text-[11px] font-normal text-muted">{note}</span>}
      </dd>
    </div>
  );
}

/** The six figures of a flight in progress, the altitude first and highlighted. */
export function LiveTiles({
  position,
  elapsedS,
  progress,
}: {
  position: PositionReport;
  elapsedS: number;
  progress: RouteProgress | null;
}) {
  const t = useTranslations("LiveFlight.tiles");
  const format = useFormatter();
  const n = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const trend = position.vs > LEVEL_FPM ? "climb" : position.vs < -LEVEL_FPM ? "descent" : "level";
  const level = flightLevel(position.altMsl);
  const tiles: [label: string, value: string, unit: string, note: string][] = [
    [
      t("altitude"),
      level ?? n(position.altMsl),
      level ? "" : "ft",
      level ? t("feet", { feet: n(position.altMsl) }) : "",
    ],
    [t("groundSpeed"), n(position.gs), "kt", ""],
    [t("heading"), String(Math.round(position.heading) % 360).padStart(3, "0"), "°", ""],
    [t("vs"), n(position.vs), "ft/min", t(trend)],
    [t("elapsed"), formatDuration(elapsedS) ?? "—", "", t("sinceBlock")],
    progress
      ? [
          t("remaining"),
          n(progress.remainingNm),
          "nm",
          t("flown", {
            flown: n(progress.flownNm),
            percent: Math.round(progress.fraction * 100),
          }),
        ]
      : [t("remaining"), "—", "", t("noPlan")],
  ];
  return (
    <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {tiles.map(([label, value, unit, note], i) => (
        <Tile key={label} label={label} value={value} unit={unit} note={note} first={i === 0} />
      ))}
    </dl>
  );
}
