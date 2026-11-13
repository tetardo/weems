import type { GoalAircraft, GoalKind, GoalView } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";

type Definition = GoalView["definition"];

/** 14,33 h → « 14 h 20 », 20 h → « 20 h ». */
function hoursText(hours: number): string {
  const minutes = Math.round(hours * 60);
  const rest = minutes % 60;
  return rest === 0
    ? `${minutes / 60} h`
    : `${Math.floor(minutes / 60)} h ${String(rest).padStart(2, "0")}`;
}

/** Texts of a goal: its title, a value in its unit, its end. */
export function useGoalText() {
  const t = useTranslations("Logbook.goals");
  const categories = useTranslations("Aircraft.categories");
  const practices = useTranslations("Logbook.stats.technique.practices");
  const format = useFormatter();
  /** Inside a sentence: « 10 h en turbopropulseur », the category in lower case. */
  const aircraftName = (aircraft: GoalAircraft) =>
    "category" in aircraft ? categories(aircraft.category).toLowerCase() : aircraft.model;
  const day = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "short", timeZone: "UTC" });
  /** The last day counted: `to` is excluded. */
  const lastDay = (to: string) => day(new Date(Date.parse(to) - 1).toISOString());

  const value = (kind: GoalKind, amount: number) =>
    kind === "hours" || kind === "aircraft"
      ? hoursText(amount)
      : kind === "goodPractices"
        ? `${Math.round(amount)} %`
        : format.number(Math.round(amount * 10) / 10);

  const title = (goal: Pick<GoalView, "definition" | "from">) => {
    const d: Definition = goal.definition;
    const base = t(`titles.${d.kind}`, {
      target: d.target,
      threshold: d.threshold ?? 0,
      aircraft: d.aircraft ? aircraftName(d.aircraft) : "",
      practice: d.practice ? practices(d.practice) : "",
    });
    const on =
      d.aircraft && d.kind !== "aircraft" ? t("on", { aircraft: aircraftName(d.aircraft) }) : "";
    const month = format.dateTime(new Date(goal.from), { month: "long", timeZone: "UTC" });
    const until = d.until
      ? format.dateTime(new Date(`${d.until}T00:00:00Z`), {
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })
      : "";
    const end = t(`ends.${d.window}`, { month, date: until });
    return [base + on, end].filter(Boolean).join(" ");
  };

  const deadline = (goal: GoalView) => (goal.to ? lastDay(goal.to) : t("noEnd"));
  return { title, value, deadline, day };
}
