import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { Button } from "../ui/button.tsx";
import { CardBox } from "../ui/card-box.tsx";
import type { ListFilters } from "./list-query.ts";

const FIELD = "flex flex-col gap-1 text-sm font-semibold";
const INPUT =
  "h-10 rounded-sm border border-gray-700 bg-white px-3 font-normal focus:border-blue-600 focus:ring-3 focus:ring-blue-600 focus:outline-hidden";

/** Period, aircraft, airport: a plain form, the filters live in the page address. */
export function FlightFilters({ filters }: { filters: ListFilters }) {
  const t = useTranslations("Flights.filters");
  return (
    <CardBox className="mb-6">
      <form className="flex flex-wrap items-end gap-4" method="get">
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
        <Button type="submit">{t("apply")}</Button>
        <Link href="/flights" className="py-2 text-sm text-blue-600 hover:underline">
          {t("reset")}
        </Link>
      </form>
    </CardBox>
  );
}
