import type { LogbookSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../../format/flight-format.ts";

interface Kpi {
  key: "hours" | "touchdown" | "clean" | "streak";
  value: string;
  /** The comparison line, good news in green, bad in orange. */
  sub: string;
  tone: Tone;
}

type Tone = "good" | "bad" | "neutral";

/** Tone of a change where higher is better; a change that rounds to 0 is neutral. */
function toneOf(change: number | null): Tone {
  if (change === null || Math.round(change) === 0) return "neutral";
  return change > 0 ? "good" : "bad";
}

const NONE = "—";

/** Difference with the period before, or null when one of the two is unknown. */
const delta = (current: number | null, previous: number | null) =>
  current === null || previous === null ? null : current - previous;

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** Airborne time this month, compared with last month. */
function hoursKpi({ current, previous }: LogbookSummary["monthAirborneS"], t: Translate): Kpi {
  const change = current - previous;
  const delta = formatDuration(Math.abs(change)) ?? NONE;
  return {
    key: "hours",
    value: formatDuration(current) ?? NONE,
    sub: change === 0 ? t("hours.same") : t("hours.sub", { sign: change < 0 ? "−" : "+", delta }),
    tone: toneOf(change),
  };
}

function useKpis(summary: LogbookSummary): Kpi[] {
  const t = useTranslations("Logbook.summary.kpis");
  const format = useFormatter();
  const signed = (n: number) =>
    format.number(n, { signDisplay: "exceptZero", maximumFractionDigits: 0 });
  const {
    monthAirborneS: hours,
    touchdownAverage: vs,
    cleanLandingShare: clean,
    streakDays,
  } = summary;
  const vsDelta = delta(vs.current, vs.previous);
  const cleanDelta = delta(clean.current, clean.previous);
  return [
    hoursKpi(hours, t),
    {
      key: "touchdown",
      value: vs.current === null ? NONE : format.number(Math.round(vs.current)),
      sub: vsDelta === null ? t("touchdown.first") : t("touchdown.sub", { delta: signed(vsDelta) }),
      tone: toneOf(vsDelta),
    },
    {
      key: "clean",
      value: clean.current === null ? NONE : format.number(clean.current, { style: "percent" }),
      sub:
        cleanDelta === null
          ? t("clean.first")
          : t("clean.sub", { delta: signed(cleanDelta * 100) }),
      tone: toneOf(cleanDelta === null ? null : cleanDelta * 100),
    },
    {
      key: "streak",
      value: t("streak.value", { days: streakDays.current }),
      sub: t("streak.sub", { days: streakDays.record }),
      tone: "neutral",
    },
  ];
}

const TONE_CLASS: Record<Tone, string> = {
  good: "text-success",
  bad: "text-accent-2",
  neutral: "text-muted",
};

/** The four figures under the last flight (spec carnet privé, § 3). */
export function SummaryKpis({ summary }: { summary: LogbookSummary }) {
  const t = useTranslations("Logbook.summary.kpis");
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {useKpis(summary).map(({ key, value, sub, tone }) => (
        <div key={key} className="rounded-panel border border-line bg-surface px-4 py-3.5">
          <div className="text-[13px] text-muted">{t(`${key}.label`)}</div>
          <div className="mt-0.5 font-title text-[26px] tabular-nums">{value}</div>
          <div className={`text-[12.5px] ${TONE_CLASS[tone]}`}>{sub}</div>
        </div>
      ))}
    </div>
  );
}
