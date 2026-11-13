import { useTranslations } from "next-intl";
import { SegmentLinks } from "../segment-links.tsx";
import { ENTRY_FILTERS, type EntryFilter, flightsHref } from "./entry-filter.ts";

/** Title of the page Vols, what it counts, and the filters of the list. */
export function FlightsHeader({ total, filter }: { total: number; filter: EntryFilter }) {
  const t = useTranslations("Logbook.flights");
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-[1.7em]">{t("title")}</h1>
        <p className="m-0 mt-1 text-muted">{t("intro", { count: total })}</p>
      </div>
      <SegmentLinks
        label={t("title")}
        segments={ENTRY_FILTERS.map((f) => ({
          key: f,
          href: flightsHref(f),
          label: t(`filters.${f}`),
          current: f === filter,
        }))}
      />
    </header>
  );
}
