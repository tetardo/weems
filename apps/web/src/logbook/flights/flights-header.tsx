import { useTranslations } from "next-intl";
import { SegmentLinks } from "../segment-links.tsx";
import { DeleteAllButton } from "./delete-all-button.tsx";
import { LOGBOOK_LIST_FILTERS, LOGBOOK_LIST_PAGE } from "@weems/contrats";
import { type ListParams, listHref } from "./list-params.ts";

/** Development tools (delete all flights): `pnpm dev` only, never in a production build. */
const DEV_TOOLS = process.env.NODE_ENV === "development";

/** Title of the page Vols, what it counts, and the filters of the list. */
export function FlightsHeader({ total, params }: { total: number; params: ListParams }) {
  const t = useTranslations("Logbook.flights");
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-[1.7em]">{t("title")}</h1>
        <p className="m-0 mt-1 text-muted">{t("intro", { count: total })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {DEV_TOOLS && total > 0 && <DeleteAllButton />}
        <SegmentLinks
          label={t("title")}
          segments={LOGBOOK_LIST_FILTERS.map((f) => ({
            key: f,
            href: listHref(params, { filter: f, shown: LOGBOOK_LIST_PAGE }),
            label: t(`filters.${f}`),
            current: f === params.filter,
          }))}
        />
      </div>
    </header>
  );
}
