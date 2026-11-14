import { LOGBOOK_LIST_PAGE, type LogbookList } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { FlightTable } from "./flight-table.tsx";
import { FlightsHeader } from "./flights-header.tsx";
import { type ListParams, listHref } from "./list-params.ts";
import { SearchForm } from "./search-form.tsx";

/** Under the list: « Charger 50 vols de plus » while flights remain, what is shown, the hint. */
function ListFooter({ list, params }: { list: LogbookList; params: ListParams }) {
  const t = useTranslations("Logbook.flights");
  const more = Math.min(LOGBOOK_LIST_PAGE, list.matching - list.entries.length);
  return (
    <>
      {list.nextOffset !== null && (
        <div className="flex justify-center border-t border-line p-3">
          <Link
            href={listHref(params, { shown: params.shown + LOGBOOK_LIST_PAGE })}
            scroll={false}
            className={buttonClass("outline")}
          >
            {t("loadMore", { count: more })}
          </Link>
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2 border-t border-line px-4 py-2.5 text-[12.5px] text-muted">
        <span>{t("shown", { shown: list.entries.length, matching: list.matching })}</span>
        <span className="max-lg:hidden">{t("openHint")}</span>
      </div>
    </>
  );
}

function emptyText(params: ListParams): "empty" | "emptySearch" | "emptyFiltered" {
  if (params.q) return "emptySearch";
  return params.filter === "all" ? "empty" : "emptyFiltered";
}

/**
 * Page Vols of the private logbook (maquette v14-liste, Greg 14/11/2026): the list alone, full
 * width; a line opens the full flight page, its button the ECAM page. No sheet any more.
 */
export function FlightsPage({ list, params }: { list: LogbookList; params: ListParams }) {
  const t = useTranslations("Logbook.flights");
  return (
    <div className="grid gap-4">
      <FlightsHeader total={list.total} params={params} />
      <SearchForm params={params} found={params.q ? list.matching : null} />
      <section className="overflow-hidden rounded-panel border border-line bg-surface">
        {list.entries.length === 0 ? (
          <p className="m-0 px-4 py-6 text-[13.5px] text-muted">{t(emptyText(params))}</p>
        ) : (
          <>
            <FlightTable entries={list.entries} params={params} />
            <ListFooter list={list} params={params} />
          </>
        )}
      </section>
    </div>
  );
}
