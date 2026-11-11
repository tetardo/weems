import type { FlightList as FlightListData } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { mdiBookOpenPageVariant } from "@mdi/js";
import { Link } from "../i18n/navigation.ts";
import { CardBox } from "../ui/card-box.tsx";
import { SectionMain } from "../ui/section-main.tsx";
import { SectionTitle } from "../ui/section-title.tsx";
import { FlightFilters } from "./flight-filters.tsx";
import { FlightTable } from "./flight-table.tsx";
import { type ListFilters, withoutCursor } from "./list-query.ts";

/** The /flights page: filters, table, link to older flights. */
export function FlightList({ list, filters }: { list: FlightListData; filters: ListFilters }) {
  const t = useTranslations("Flights");
  const kept = withoutCursor(filters);
  const filtered = Object.keys(kept).length > 0;
  return (
    <SectionMain>
      <SectionTitle icon={mdiBookOpenPageVariant} title={t("title")} main />
      <FlightFilters filters={filters} />
      {list.flights.length === 0 ? (
        <CardBox>
          <p className="text-gray-500">{filtered ? t("emptyFiltered") : t("empty")}</p>
        </CardBox>
      ) : (
        <CardBox flush>
          <FlightTable flights={list.flights} />
        </CardBox>
      )}
      <nav className="mt-4 flex gap-4 text-sm">
        {filters.cursor && (
          <Link
            href={{ pathname: "/flights", query: { ...kept } }}
            className="text-blue-600 hover:underline"
          >
            {t("first")}
          </Link>
        )}
        {list.nextCursor && (
          <Link
            href={{ pathname: "/flights", query: { ...kept, cursor: list.nextCursor } }}
            className="text-blue-600 hover:underline"
          >
            {t("next")}
          </Link>
        )}
      </nav>
    </SectionMain>
  );
}
