import { type MyRank, type RankFlight, rankIndex } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration, formatRoute } from "../../format/flight-format.ts";
import { RankIcon } from "../../ui/icons.ts";
import { RankInsignia } from "../../ui/rank-insignia.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { rankProgress } from "./rank-progress.ts";

function Bar({ label, value, share }: { label: string; value: string; share: number }) {
  return (
    <div className="mt-3.5">
      <div className="flex justify-between text-[12.5px] text-muted">
        <span>{label}</span>
        <b className="font-mono text-ink">{value}</b>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full border border-line bg-line/40">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>
    </div>
  );
}

/** The two bars towards the next rank and what is missing; a line at the last rank. */
function NextRank({ rank }: { rank: MyRank }) {
  const t = useTranslations("Ranks.card");
  const format = useFormatter();
  const hours = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  const { next } = rank;
  if (!next) return <p className="m-0 mt-3.5 text-muted">{t("top")}</p>;
  const progress = rankProgress(rank);
  const missing =
    progress.missingHours > 0 && progress.missingFlights > 0
      ? t("missing", { hours: hours(progress.missingHours), flights: progress.missingFlights })
      : progress.missingHours > 0
        ? t("missingHours", { hours: hours(progress.missingHours) })
        : t("missingFlights", { flights: progress.missingFlights });
  return (
    <>
      <Bar
        label={t("hours")}
        value={t("hoursValue", { done: hours(rank.validHours), need: next.hours })}
        share={progress.hoursShare}
      />
      <Bar
        label={t("flights")}
        value={t("flightsValue", { done: rank.validFlights, need: next.flights })}
        share={progress.flightsShare}
      />
      <p className="m-0 mt-3.5 rounded-box bg-line/40 px-3 py-2 text-[12.5px] text-muted">
        {missing}
      </p>
    </>
  );
}

/** Where the pilot stands: insignia, name, date and next rank, then the progress. */
function Standing({ rank }: { rank: MyRank }) {
  const t = useTranslations("Ranks");
  const format = useFormatter();
  const since = rank.reachedAt
    ? t("card.since", { date: format.dateTime(new Date(rank.reachedAt), { dateStyle: "short" }) })
    : t("card.first");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line pb-3.5">
        <RankInsignia rank={rank.rank} size={64} />
        <div className="min-w-0">
          <p className="m-0 font-title text-[22px] font-bold">{t(`names.${rank.rank}`)}</p>
          <p className="m-0 text-[12.5px] text-muted">
            {since} · {t("card.position", { index: rankIndex(rank.rank) + 1 })}
          </p>
        </div>
        {rank.next && (
          <div className="ml-auto flex-none text-right">
            <p className="m-0 text-[10.5px] font-semibold tracking-widest text-muted uppercase">
              {t("card.next")}
            </p>
            <p className="m-0 mt-1 flex items-center justify-end gap-2 font-title font-semibold whitespace-nowrap">
              <RankInsignia rank={rank.next.rank} size={26} />
              {t(`names.${rank.next.rank}`)}
            </p>
          </div>
        )}
      </div>
      <NextRank rank={rank} />
    </div>
  );
}

function FlightLine({ flight }: { flight: RankFlight }) {
  const checks = useTranslations("Founders.checks");
  const t = useTranslations("Ranks.card");
  const format = useFormatter();
  const valid = flight.validity === "valid";
  const date = format.dateTime(new Date(flight.openedAt), { day: "2-digit", month: "2-digit" });
  return (
    <li className="grid grid-cols-[18px_1fr_auto] items-start gap-2.5 border-t border-line py-2.5 first:border-t-0">
      <span
        aria-hidden="true"
        className={valid ? "font-bold text-success" : "font-bold text-danger"}
      >
        {valid ? "✓" : "✕"}
      </span>
      <span className="min-w-0">
        <b className="font-semibold">
          {formatRoute(flight.departureIcao, flight.arrivalIcao)} · {flight.aircraftTitle}
        </b>
        <small className="block text-[12px] text-muted">
          {date} · {checks(flight.validity)}
        </small>
      </span>
      <span className={`font-mono text-[13px] ${valid ? "" : "text-muted"}`}>
        {valid
          ? t("counted", { hours: formatDuration(flight.countedHours * 3600) ?? "0:00" })
          : t("notCounted")}
      </span>
    </li>
  );
}

/**
 * Card « Votre grade » of the page Résumé (spec grades des pilotes): rank and progress on the left,
 * the latest flights and what they brought on the right.
 */
export function RankCard({ rank }: { rank: MyRank }) {
  const t = useTranslations("Ranks.card");
  const format = useFormatter();
  const hours = (value: number) => format.number(value, { maximumFractionDigits: 0 });
  return (
    <LogbookCard
      icon={RankIcon}
      title={t("title")}
      aside={t("totals", { total: hours(rank.totalHours), valid: hours(rank.validHours) })}
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Standing rank={rank} />
        <div>
          <h3 className="m-0 mb-1 text-[14px] text-muted">{t("recent")}</h3>
          {rank.recentFlights.length > 0 ? (
            <ul className="m-0 list-none p-0">
              {rank.recentFlights.map((flight) => (
                <FlightLine key={flight.flightId} flight={flight} />
              ))}
            </ul>
          ) : (
            <p className="m-0 text-muted">{t("none")}</p>
          )}
        </div>
      </div>
    </LogbookCard>
  );
}
