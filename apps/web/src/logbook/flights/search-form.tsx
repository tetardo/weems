import { useLocale, useTranslations } from "next-intl";
import { getPathname, Link } from "../../i18n/navigation.ts";
import { CloseIcon, SearchIcon } from "../../ui/icons.ts";
import { type ListParams, listHref } from "./list-params.ts";

/**
 * Search of the page Vols: a plain form sent on Enter, so it works without JavaScript; the
 * filter and the sort stay, the list starts again at its first 50 lines.
 */
export function SearchForm({ params, found }: { params: ListParams; found: number | null }) {
  const t = useTranslations("Logbook.flights");
  const locale = useLocale();
  // The filter and the sort as the address writes them (defaults left out), without the search.
  const keep = new URLSearchParams(listHref(params, { q: "", shown: 50 }).split("?")[1] ?? "");
  return (
    <form
      role="search"
      action={getPathname({ href: "/logbook/flights", locale })}
      className="flex flex-wrap items-center gap-3"
    >
      <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-control border border-line bg-surface px-3 sm:max-w-md">
        <SearchIcon size={16} className="shrink-0 text-muted" aria-hidden="true" />
        <span className="sr-only">{t("searchLabel")}</span>
        <input
          type="search"
          name="q"
          defaultValue={params.q}
          maxLength={64}
          placeholder={t("search")}
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
        {params.q && (
          <Link
            href={listHref(params, { q: "", shown: 50 })}
            aria-label={t("clearSearch")}
            className="text-muted hover:text-ink"
          >
            <CloseIcon size={15} aria-hidden="true" />
          </Link>
        )}
      </label>
      {[...keep].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {found !== null && (
        <span className="text-[13px] text-muted">{t("found", { count: found })}</span>
      )}
    </form>
  );
}
