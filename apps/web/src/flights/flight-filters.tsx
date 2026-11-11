import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import type { ListFilters } from "./list-query.ts";

const FIELD = "flex flex-col gap-0.5 text-xs text-muted";
const INPUT = "rounded border border-line px-2 py-1 text-sm text-ink";

/** Period, aircraft, airport: a plain form, the filters live in the page address. */
export function FlightFilters({ filters }: { filters: ListFilters }) {
  const t = useTranslations("Flights.filters");
  return (
    <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
      <label className={FIELD}>
        {t("from")}
        <input className={INPUT} type="date" name="from" defaultValue={filters.from} />
      </label>
      <label className={FIELD}>
        {t("to")}
        <input className={INPUT} type="date" name="to" defaultValue={filters.to} />
      </label>
      <label className={FIELD}>
        {t("aircraft")}
        <input className={INPUT} name="aircraft" defaultValue={filters.aircraft} maxLength={64} />
      </label>
      <label className={FIELD}>
        {t("airport")}
        <input
          className={`${INPUT} w-24 uppercase`}
          name="airport"
          defaultValue={filters.airport}
          maxLength={4}
        />
      </label>
      <button type="submit" className="rounded bg-ink px-3 py-1.5 text-sm text-white">
        {t("apply")}
      </button>
      <Link href="/flights" className="py-1.5 text-sm text-muted underline">
        {t("reset")}
      </Link>
    </form>
  );
}
