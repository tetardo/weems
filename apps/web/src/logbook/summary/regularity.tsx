import type { LogbookSummary } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { formatDuration } from "../../format/flight-format.ts";
import { CalendarIcon } from "../../ui/icons.ts";
import { type CalendarDay, flyingCalendar } from "./calendar.ts";
import { SummaryCard } from "./summary-card.tsx";

/** Same span as the API (17 weeks, about four months). */
const WEEKS = 17;
const LEVEL_CLASS = ["bg-line/70", "bg-accent/30", "bg-accent/60", "bg-accent"] as const;
/** Weekdays written on the left: Monday, Wednesday, Friday, Sunday. */
const WEEKDAY_LABELS = [0, 2, 4, 6];

/** Month written above the first column (week) that starts in it. */
function MonthRow({ days }: { days: readonly CalendarDay[] }) {
  const format = useFormatter();
  const mondays = days.filter((d) => d.weekday === 0);
  return (
    <>
      <span />
      {mondays.map((monday, i) => {
        const month = monday.day.slice(0, 7);
        const first = i === 0 || mondays[i - 1]?.day.slice(0, 7) !== month;
        return (
          <span
            key={monday.day}
            className="overflow-visible text-[11.5px] whitespace-nowrap text-muted"
          >
            {first ? format.dateTime(new Date(monday.day), { month: "short" }) : ""}
          </span>
        );
      })}
    </>
  );
}

function DayCell({ day }: { day: CalendarDay }) {
  const t = useTranslations("Logbook.summary.regularity");
  const format = useFormatter();
  const date = format.dateTime(new Date(day.day), {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const title =
    day.flights === 0
      ? date
      : `${date} : ${t("day", { flights: day.flights, time: formatDuration(day.airborneS) ?? "" })}`;
  return (
    <span
      title={title}
      style={{ gridColumn: day.week + 2, gridRow: day.weekday + 2 }}
      className={`aspect-square rounded-[3px] ${LEVEL_CLASS[day.level] ?? LEVEL_CLASS[0]}`}
    />
  );
}

/** « Régularité »: one square per day over 17 weeks, darker with more flying (maquette v6). */
export function Regularity({
  flyingDays,
  today,
}: {
  flyingDays: LogbookSummary["flyingDays"];
  today: Date;
}) {
  const t = useTranslations("Logbook.summary.regularity");
  const format = useFormatter();
  const days = flyingCalendar(flyingDays, today, WEEKS);
  const flown = days.filter((d) => d.flights > 0).length;
  return (
    <SummaryCard icon={CalendarIcon} title={t("title")} aside={t("aside", { weeks: WEEKS })}>
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `1.4em repeat(${WEEKS}, minmax(0, 1fr))` }}
      >
        <MonthRow days={days} />
        {WEEKDAY_LABELS.map((weekday) => (
          <span
            key={weekday}
            style={{ gridColumn: 1, gridRow: weekday + 2 }}
            className="self-center text-[11.5px] text-muted"
          >
            {format.dateTime(new Date(Date.UTC(2024, 0, 1 + weekday)), { weekday: "narrow" })}
          </span>
        ))}
        {days.map((day) => (
          <DayCell key={day.day} day={day} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          {t("less")}
          {LEVEL_CLASS.slice(1).map((level) => (
            <span key={level} className={`size-2.5 rounded-[3px] ${level}`} />
          ))}
          {t("more")}
        </span>
        <span>{t("total", { days: flown, weeks: WEEKS })}</span>
      </div>
    </SummaryCard>
  );
}
