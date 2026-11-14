"use client";

import type { BandMinute, BandRow, FlightBands as Bands, FlightPhase } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { useTime } from "../flights/band-parts.tsx";
import { ECAM_COLUMNS, PHASE_CODES, ecamCell, type EcamCell } from "./ecam-values.ts";

const TREND_ARROWS = { up: "↑", down: "↓" } as const;

/** Value of one row: green or white, amber when marked, boxed when the setting changed. */
function Value({ cell }: { cell: EcamCell }) {
  const t = useTranslations("Logbook.ecam");
  if (cell.value === "unmeasured")
    return (
      <dd className="m-0 text-right text-ecam-dim" title={t("unmeasuredTitle")}>
        {t("unmeasured")}
      </dd>
    );
  if (cell.value === null) return <dd className="m-0 text-right text-ecam-dim">---</dd>;
  const tone = cell.marked
    ? "text-ecam-amber"
    : cell.value.tone === "green"
      ? "text-ecam-green"
      : "text-ecam-white";
  return (
    <dd className={`m-0 text-right tabular-nums ${tone}`}>
      <span
        className={cell.changed ? "px-[3px] outline-1 outline-offset-1 outline-ecam-white" : ""}
      >
        {cell.value.text}
      </span>
    </dd>
  );
}

/** One line: abbreviation (full name on hover), value, trend, unit. */
function Line({ row, cell }: { row: BandRow; cell: EcamCell }) {
  const rows = useTranslations("Logbook.bands.rows");
  const short = useTranslations("Logbook.bands.shortRows");
  const unit = typeof cell.value === "object" && cell.value ? cell.value.unit : "";
  return (
    <div className="grid h-[22px] grid-cols-[10.5ch_minmax(0,1fr)_2ch_5.5ch] gap-x-1.5 whitespace-nowrap">
      <dt
        title={rows(row)}
        className={`cursor-help ${cell.marked ? "text-ecam-amber" : "text-ecam-white/85"}`}
      >
        {short(row)}
      </dt>
      <Value cell={cell} />
      <dd className="m-0 text-center text-ecam-green">{cell.trend && TREND_ARROWS[cell.trend]}</dd>
      <dd className="m-0 text-[11.5px] text-ecam-cyan">{unit}</dd>
    </div>
  );
}

const BOX = "border px-2 leading-[18px] font-bold tracking-[.08em]";
const LIT = {
  green: "border-ecam-green text-ecam-green",
  white: "border-ecam-white text-ecam-white",
};
const DIM = "border-ecam-dim text-ecam-dim";

/** Flight mode, as on a FMA: dimmed when unknown. */
function PhaseBox({ phase }: { phase: FlightPhase | null }) {
  return (
    <span className={`${BOX} ${phase ? LIT.green : DIM}`}>
      {phase ? PHASE_CODES[phase] : "----"}
    </span>
  );
}

/** Autopilot beside the mode: AP engaged, AP OFF dimmed, nothing when not recorded. */
function AutopilotBox({ value }: { value: number | null }) {
  const t = useTranslations("Logbook.ecam");
  if (value === null) return null;
  const engaged = value >= 0.5;
  return (
    <span className={`${BOX} ${engaged ? LIT.white : DIM}`}>{engaged ? "AP" : t("apOff")}</span>
  );
}

/** Time, modes, held state and hint. */
function Header({ minute, pinned }: { minute: BandMinute | undefined; pinned: boolean }) {
  const t = useTranslations("Logbook.ecam");
  const time = useTime();
  const hint = pinned ? t("pinnedHint") : minute ? t("hover") : t("idle");
  return (
    <div className="mb-2 box-content flex h-[22px] items-center gap-3 border-b border-ecam-edge pb-1.5 whitespace-nowrap">
      <span className="font-bold tracking-wide text-ecam-white">
        {minute ? time(minute.at) : "--:--"}
        {minute && <small className="ml-0.5 font-normal text-ecam-cyan">Z</small>}
      </span>
      <PhaseBox phase={minute?.phase ?? null} />
      <AutopilotBox value={minute?.values.autopilot ?? null} />
      {pinned && (
        <span className="border border-ecam-cyan px-1.5 text-[12px] leading-[18px] tracking-wide text-ecam-cyan">
          {t("pinned")}
        </span>
      )}
      <span className="ml-auto hidden text-[12px] text-ecam-dim sm:inline">{hint}</span>
    </div>
  );
}

/**
 * Every value of the minute read, cockpit style: same frame and same height whether a minute is
 * read or not, abbreviations only, three columns in band order.
 */
export function EcamLegend({
  bands,
  index,
  pinned,
  unmeasured,
}: {
  bands: Bands;
  index: number | null;
  pinned: boolean;
  unmeasured: ReadonlySet<BandRow>;
}) {
  const idle: EcamCell = { value: null, changed: false, trend: null, marked: false };
  return (
    <div className="mt-3 border-t border-ecam-edge pt-2.5 text-[13px] leading-[22px]">
      <Header minute={index === null ? undefined : bands.minutes[index]} pinned={pinned} />
      <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-3">
        {ECAM_COLUMNS.map(({ key, rows }) => (
          <dl
            key={key}
            className="m-0 sm:border-l sm:border-ecam-edge sm:px-3.5 sm:first:border-l-0 sm:first:pl-0 sm:last:pr-0"
          >
            {rows.map((row) => (
              <Line
                key={row}
                row={row}
                cell={index === null ? idle : ecamCell(bands, row, index, unmeasured)}
              />
            ))}
          </dl>
        ))}
      </div>
    </div>
  );
}
