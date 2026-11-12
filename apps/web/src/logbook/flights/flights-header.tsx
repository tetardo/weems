import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
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
      <nav
        aria-label={t("title")}
        className="flex gap-1 rounded-control border border-line bg-surface p-1"
      >
        {ENTRY_FILTERS.map((f) => (
          <Link
            key={f}
            href={flightsHref(f)}
            aria-current={f === filter ? "page" : undefined}
            className={`rounded-inner px-3 py-1.5 text-[13.5px] font-medium ${f === filter ? "bg-accent/12 text-link" : "text-muted hover:text-ink"}`}
          >
            {t(`filters.${f}`)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
