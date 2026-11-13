import { useTranslations } from "next-intl";
import { formatDuration } from "../../format/flight-format.ts";
import { CompareIcon } from "../../ui/icons.ts";
import { LockedCard } from "../locked-card.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import type { AircraftComparison, ComparedFigure } from "./aircraft-comparison.ts";

/** This flight's bar, the pilot's mean as a tick. */
function FigureRow({
  label,
  mean,
  value,
  figure,
}: {
  label: string;
  mean: string;
  value: string;
  figure: ComparedFigure;
}) {
  const width = (v: number) => `${(100 * v) / figure.max}%`;
  return (
    <div className="grid grid-cols-[7.5em_minmax(0,1fr)_4.5em] items-center gap-3">
      <div>
        <div className="text-[13px] font-semibold">{label}</div>
        <div className="text-[11.5px] text-muted">{mean}</div>
      </div>
      <div className="relative h-2.5 rounded-tag bg-line">
        <div className="h-full rounded-tag bg-accent" style={{ width: width(figure.value) }} />
        <div
          className="absolute -top-1 h-[18px] w-0.5 bg-ink"
          style={{ left: width(figure.mean) }}
        />
      </div>
      <b className="text-right text-[13px] tabular-nums">{value}</b>
    </div>
  );
}

/** « Comparé à vos vols » (Pilot Pro): touchdown and block time against the same aircraft. */
export function ComparisonCard({
  comparison,
  locked,
}: {
  comparison: AircraftComparison | null;
  locked: boolean;
}) {
  const t = useTranslations("Logbook.flight.compare");
  if (locked) return <LockedCard title={t("title")} text={t("locked")} />;
  const duration = (s: number) => formatDuration(s) ?? "—";
  return (
    <LogbookCard
      icon={CompareIcon}
      title={t("title")}
      aside={comparison && t("aside", { aircraft: comparison.aircraft, count: comparison.flights })}
      className="h-full"
    >
      {comparison ? (
        <div className="grid gap-4">
          {comparison.touchdownRank !== null && (
            <p className="m-0 text-[13px] text-muted">
              {t("rank", { rank: comparison.touchdownRank, aircraft: comparison.aircraft })}
            </p>
          )}
          {comparison.touchdown && (
            <FigureRow
              label={t("touchdown")}
              mean={t("mean", { value: `−${Math.round(comparison.touchdown.mean)}` })}
              value={`−${Math.round(comparison.touchdown.value)}`}
              figure={comparison.touchdown}
            />
          )}
          {comparison.block && (
            <FigureRow
              label={t("block")}
              mean={t("mean", { value: duration(comparison.block.mean) })}
              value={duration(comparison.block.value)}
              figure={comparison.block}
            />
          )}
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      )}
    </LogbookCard>
  );
}
