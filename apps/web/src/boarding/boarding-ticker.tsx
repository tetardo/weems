import type { Boarding } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { tickerFacts } from "./board-rows.ts";

/** Line under the boards, like the scrolling messages of a terminal: what stands out now. */
export function BoardingTicker({ board }: { board: Boarding }) {
  const t = useTranslations("Boarding.ticker");
  const { busiest, softest } = tickerFacts(board);
  const facts = [
    t("flights", { departures: board.departures.length, arrivals: board.arrivals.length }),
    busiest && t("busiest", { icao: busiest.icao, count: busiest.count }),
    softest && t("softest", { callsign: softest.callsign, vs: Math.round(softest.touchdownVs) }),
  ].filter((fact): fact is string => Boolean(fact));
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-box border border-board-edge bg-board px-4 py-2 font-mono text-[11.5px] font-semibold tracking-[.06em] text-board-ink uppercase">
      <span className="text-board-muted">{t("now")}</span>
      {facts.map((fact) => (
        <span key={fact}>{fact}</span>
      ))}
    </p>
  );
}
