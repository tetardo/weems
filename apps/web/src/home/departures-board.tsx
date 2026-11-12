"use client";

import type { SiteStats } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Link } from "../i18n/navigation.ts";
import { useLiveFlights } from "../live/use-live-flights.ts";
import { DepartureIcon } from "../ui/icons.ts";
import {
  BOARD_ROWS_PHONE,
  type BoardRow,
  boardRows,
  type Level,
  moreFlights,
  type PhaseGroup,
} from "./departures.ts";
import { SplitFlap } from "./split-flap.tsx";

const PHASE_TONE: Record<PhaseGroup, string> = {
  ground: "bg-board-ground/15 text-board-ground",
  climb: "bg-board-climb/15 text-board-climb",
  cruise: "bg-board-cruise/15 text-board-cruise",
  descent: "bg-board-descent/15 text-board-descent",
  approach: "bg-board-approach/15 text-board-approach",
};

function Counter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-2 py-3 not-first:border-l not-first:border-board-edge">
      <span className="text-[10.5px] tracking-[.16em] text-board-label uppercase">{label}</span>
      {children}
    </div>
  );
}

/** Level in the air (on the ground, the « Au sol » label already says it). */
function LevelCell({ level }: { level: Exclude<Level, { kind: "ground" }> }) {
  const t = useTranslations("Home.board");
  if (level.kind === "flightLevel") return level.value;
  return t("feet", { value: level.value });
}

/** One flight on one line; its level shows on hover only. A phone shows the first 4 lines. */
function Row({ row, phone }: { row: BoardRow; phone: boolean }) {
  const t = useTranslations("Home.board");
  return (
    <tr className={`group border-t border-board-line ${phone ? "" : "max-md:hidden"}`}>
      <td className="py-2.5 pl-5 font-bold whitespace-nowrap text-board-call max-sm:pl-4">
        {row.callsign}
      </td>
      <td className="px-3 py-2.5 whitespace-nowrap">
        {row.from ?? "—"} <span className="text-board-muted">→</span> {row.to ?? "—"}
      </td>
      <td className="py-2.5 pr-5 text-right whitespace-nowrap max-sm:pr-4">
        {row.level.kind !== "ground" && (
          <span className="mr-2 text-xs text-board-muted opacity-0 transition-opacity group-hover:opacity-100">
            <span className="sr-only">{t("level")} </span>
            <LevelCell level={row.level} />
          </span>
        )}
        <span
          className={`rounded-tag px-2 py-0.5 text-xs font-bold tracking-[.06em] uppercase ${PHASE_TONE[row.phase]}`}
        >
          {t(`phases.${row.phase}`)}
        </span>
      </td>
    </tr>
  );
}

/** Title, « Direct » mark and the three split-flap counters. */
function BoardHead({ stats, live }: { stats: SiteStats | null; live: number | null }) {
  const t = useTranslations("Home.board");
  return (
    <div className="border-b border-board-edge bg-board-head">
      <div className="flex items-center gap-3 px-5 py-3.5 max-sm:px-4">
        <h2 className="mr-auto flex items-center gap-2.5 text-base font-bold tracking-[.2em] text-board-title uppercase">
          <DepartureIcon size={18} aria-hidden="true" />
          {t("title")}
        </h2>
        <span className="flex items-center gap-2 text-[11px] tracking-[.16em] text-board-muted uppercase">
          <span className="size-2 animate-pulse rounded-full bg-board-live" />
          {t("direct")}
        </span>
      </div>
      <div className="grid grid-cols-3 border-t border-board-edge">
        <Counter label={t("pilots")}>
          <SplitFlap value={stats?.pilots ?? null} width={4} size="sm" />
          <span className="sr-only">{stats?.pilots}</span>
        </Counter>
        <Counter label={t("flights")}>
          <SplitFlap value={stats?.flights ?? null} width={5} size="sm" />
          <span className="sr-only">{stats?.flights}</span>
        </Counter>
        <Counter label={t("live")}>
          <SplitFlap value={live} width={3} size="sm" />
          <span className="sr-only">{live}</span>
        </Counter>
      </div>
    </div>
  );
}

/** Flights live now, or a line saying there is none. */
function BoardTable({ rows }: { rows: BoardRow[] }) {
  const t = useTranslations("Home.board");
  return (
    <table className="w-full border-collapse text-[15px] max-sm:text-[13px]">
      <thead className="sr-only">
        <tr>
          <th>{t("flight")}</th>
          <th>{t("route")}</th>
          <th>{t("phase")}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <Row key={row.flightId} row={row} phone={index < BOARD_ROWS_PHONE} />
        ))}
        {rows.length === 0 && (
          <tr className="border-t border-board-line">
            <td colSpan={3} className="px-5 py-3 text-board-muted max-sm:px-4">
              {t("none")}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/** « + N vols · voir la carte en direct »: N counts the flights left out, 8 shown on a computer, 4 on a phone. */
function MoreLink({ live, shown }: { live: number; shown: number }) {
  const t = useTranslations("Home.board");
  const more = (count: number, className: string) =>
    count > 0 && <span className={className}>{t("more", { count })} · </span>;
  return (
    <Link
      href="/live"
      className="block border-t border-board-line px-5 py-3 text-xs tracking-[.14em] text-board-call max-sm:tracking-[.06em] uppercase hover:underline max-sm:px-4"
    >
      {more(moreFlights(live, shown), "max-md:hidden")}
      {more(moreFlights(live, Math.min(shown, BOARD_ROWS_PHONE)), "md:hidden")}
      {t("seeMap")} →
    </Link>
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
  const rows = boardRows(flights);
  return (
    <section
      aria-label={t("title")}
      className="overflow-hidden rounded-panel border border-board-edge bg-board font-mono text-board-ink shadow-floating"
    >
      <BoardHead stats={stats} live={live} />
      <BoardTable rows={rows} />
      <MoreLink live={flights.size} shown={rows.length} />
    </section>
  );
}
