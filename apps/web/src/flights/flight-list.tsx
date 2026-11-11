import type { FlightList as FlightListData } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { FlightFilters } from "./flight-filters.tsx";
import { FlightTable } from "./flight-table.tsx";
import { type ListFilters, withoutCursor } from "./list-query.ts";

/** The /flights page: filters, table, link to older flights. */
export function FlightList({ list, filters }: { list: FlightListData; filters: ListFilters }) {
  const t = useTranslations("Flights");
  const kept = withoutCursor(filters);
  const filtered = Object.keys(kept).length > 0;
  return (
    <main className="mx-auto w-full max-w-6xl p-4">
      <h1 className="mb-3 text-xl font-semibold">{t("title")}</h1>
      <FlightFilters filters={filters} />
      {list.flights.length === 0 ? (
        <p className="text-muted">{filtered ? t("emptyFiltered") : t("empty")}</p>
      ) : (
        <FlightTable flights={list.flights} />
      )}
      <nav className="mt-4 flex gap-4 text-sm">
        {filters.cursor && (
          <Link href={{ pathname: "/flights", query: { ...kept } }} className="underline">
            {t("first")}
          </Link>
        )}
        {list.nextCursor && (
          <Link
            href={{ pathname: "/flights", query: { ...kept, cursor: list.nextCursor } }}
            className="underline"
          >
            {t("next")}
          </Link>
        )}
      </nav>
    </main>
  );
}
