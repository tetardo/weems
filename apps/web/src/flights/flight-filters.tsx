import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { Button, buttonClass } from "../ui/button.tsx";
import { CardBox } from "../ui/card-box.tsx";
import { INPUT_CLASS as INPUT } from "../ui/input-class.ts";
import type { ListFilters } from "./list-query.ts";

const FIELD = "flex flex-col gap-1.5 font-semibold";

/** Period, aircraft, airport: a plain form, the filters live in the page address. */
export function FlightFilters({ filters }: { filters: ListFilters }) {
  const t = useTranslations("Flights.filters");
  return (
    <CardBox className="mb-6">
      <form className="flex flex-wrap items-end gap-4" method="get">
        <label className={`${FIELD} min-w-40 flex-1 sm:flex-none`}>
          {t("from")}
          <input className={INPUT} type="date" name="from" defaultValue={filters.from} />
        </label>
        <label className={`${FIELD} min-w-40 flex-1 sm:flex-none`}>
          {t("to")}
          <input className={INPUT} type="date" name="to" defaultValue={filters.to} />
        </label>
        <label className={`${FIELD} min-w-40 flex-1 sm:flex-none`}>
          {t("aircraft")}
          <input className={INPUT} name="aircraft" defaultValue={filters.aircraft} maxLength={64} />
        </label>
        <label className={`${FIELD} w-36`}>
          {t("airport")}
          <input
            className={`${INPUT} uppercase`}
            name="airport"
            defaultValue={filters.airport}
            maxLength={4}
          />
        </label>
        <Button type="submit">{t("apply")}</Button>
        <Link href="/flights" className={`${buttonClass("ghost")} text-link`}>
          {t("reset")}
        </Link>
      </form>
    </CardBox>
  );
}
