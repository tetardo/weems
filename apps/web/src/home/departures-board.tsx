"use client";

import type { SiteStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useLiveFlights } from "../live/use-live-flights.ts";
import { DepartureIcon, PilotsIcon } from "../ui/icons.ts";
import { type BoardRow, boardRows, type Level, type PhaseGroup } from "./departures.ts";
import { SplitFlap } from "./split-flap.tsx";

const PHASE_TONE: Record<PhaseGroup, string> = {
  ground: "bg-board-ground/15 text-board-ground",
  climb: "bg-board-climb/15 text-board-climb",
  cruise: "bg-board-cruise/15 text-board-cruise",
  descent: "bg-board-descent/15 text-board-descent",
  approach: "bg-board-approach/15 text-board-approach",
};

function Counter({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className="flex items-center gap-2.5 text-[11px] tracking-[.12em] text-board-muted uppercase">
      {icon}
      {label}
      {children}
    </span>
  );
}

function LevelCell({ level }: { level: Level }) {
  const t = useTranslations("Home.board");
  if (level.kind === "ground") return t("ground");
  if (level.kind === "flightLevel") return level.value;
  return t("feet", { value: level.value });
}

function Row({ row }: { row: BoardRow }) {
  const t = useTranslations("Home.board");
  return (
    <tr className="border-t border-board-line">
      <td className="px-5 py-2 font-bold text-board-call max-sm:px-3">{row.callsign}</td>
      <td className="px-5 py-2 max-sm:px-3">{row.from ?? "—"}</td>
      <td className="px-5 py-2 max-sm:px-3">{row.to ?? "—"}</td>
      <td className="px-5 py-2 max-sm:px-3">
        <span
          className={`rounded-[5px] px-2 py-0.5 text-xs font-bold tracking-[.06em] uppercase ${PHASE_TONE[row.phase]}`}
        >
          {t(`phases.${row.phase}`)}
        </span>
      </td>
      <td className="px-5 py-2 max-sm:hidden">
        <LevelCell level={row.level} />
      </td>
    </tr>
  );
}

const HEADING =
  "px-5 pt-2.5 pb-1 text-left text-[10.5px] font-semibold tracking-[.16em] text-board-label max-sm:px-3";

/** Title and the three split-flap counters. */
function BoardHead({ stats, live }: { stats: SiteStats | null; live: number | null }) {
  const t = useTranslations("Home.board");
  return (
    <div className="flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-board-edge bg-board-head px-5 py-3.5 max-sm:px-3.5">
      <h2 className="mr-auto flex items-center gap-2.5 text-base font-bold tracking-[.2em] text-board-title uppercase max-sm:w-full">
        <DepartureIcon size={18} aria-hidden="true" />
        {t("title")}
      </h2>
      <Counter label={t("pilots")} icon={<PilotsIcon size={14} aria-hidden="true" />}>
        <SplitFlap value={stats?.pilots ?? null} width={4} size="sm" />
        <span className="sr-only">{stats?.pilots}</span>
      </Counter>
      <Counter label={t("flights")} icon={<DepartureIcon size={14} aria-hidden="true" />}>
        <SplitFlap value={stats?.flights ?? null} width={5} size="sm" />
        <span className="sr-only">{stats?.flights}</span>
      </Counter>
      <Counter
        label={t("live")}
        icon={<span className="size-2.5 animate-pulse rounded-full bg-board-live" />}
      >
        <SplitFlap value={live} width={3} size="sm" />
        <span className="sr-only">{live}</span>
      </Counter>
    </div>
  );
}

/** Flights live now, or a line saying there is none. */
function BoardTable({ rows }: { rows: BoardRow[] }) {
  const t = useTranslations("Home.board");
  return (
    <table className="w-full border-collapse text-[15px] max-sm:text-[13px]">
      <thead>
        <tr>
          <th className={HEADING}>{t("flight")}</th>
          <th className={HEADING}>{t("from")}</th>
          <th className={HEADING}>{t("to")}</th>
          <th className={HEADING}>{t("phase")}</th>
          <th className={`${HEADING} max-sm:hidden`}>{t("level")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <Row key={row.flightId} row={row} />
        ))}
        {rows.length === 0 && (
          <tr className="border-t border-board-line">
            <td colSpan={5} className="px-5 py-3 text-board-muted max-sm:px-3">
              {t("none")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/**
 * Departures board of the home page (spec J4 accueil, parts 4 and 5): counters, then the flights
 * live now. Pilots and flights come from the server; the flights live follow the live stream.
 */
export function DeparturesBoard({ stats, apiUrl }: { stats: SiteStats | null; apiUrl: string }) {
  const t = useTranslations("Home.board");
  const { flights, connection } = useLiveFlights(apiUrl);
  const live = connection === "open" ? flights.size : (stats?.liveFlights ?? null);
  return (
    <section
      aria-label={t("title")}
      className="overflow-hidden rounded-2xl border border-board-edge bg-board font-mono text-board-ink shadow-floating"
    >
      <BoardHead stats={stats} live={live} />
      <BoardTable rows={boardRows(flights)} />
    </section>
  );
}
