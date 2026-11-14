import type { LogbookListEntry, LogbookListSort } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { SortAscIcon, SortDescIcon, SortIcon } from "../../ui/icons.ts";
import { FlightRow } from "./flight-row.tsx";
import { type ListParams, sortHref } from "./list-params.ts";
import { TABLE_GRID } from "./table-layout.ts";

type Column = "date" | "route" | "aircraft" | "block" | "touchdown" | "verdict";

/** Header cells, in the order of the lines; the sortable ones say which column they sort. */
const COLUMNS: readonly { key: Column; sort?: LogbookListSort; right?: boolean }[] = [
  { key: "date", sort: "date" },
  { key: "route" },
  { key: "aircraft" },
  { key: "block", sort: "block", right: true },
  { key: "touchdown", sort: "touchdown", right: true },
  { key: "verdict" },
];

function HeaderCell({ column, params }: { column: (typeof COLUMNS)[number]; params: ListParams }) {
  const t = useTranslations("Logbook.flights");
  const label = t(`columns.${column.key}`);
  const align = column.right ? "justify-end" : "";
  if (!column.sort) return <span role="columnheader">{label}</span>;
  const current = params.sort === column.sort;
  const Arrow = !current ? SortIcon : params.order === "asc" ? SortAscIcon : SortDescIcon;
  return (
    <span
      role="columnheader"
      aria-sort={current ? (params.order === "asc" ? "ascending" : "descending") : "none"}
      className={`flex ${align}`}
    >
      <Link
        href={sortHref(params, column.sort)}
        title={t("sortBy", { column: label })}
        className={`inline-flex items-center gap-1 ${current ? "text-ink" : "hover:text-ink"}`}
      >
        {label}
        <Arrow size={12} className={current ? "text-link" : "opacity-60"} aria-hidden="true" />
      </Link>
    </span>
  );
}

/** List of the page Vols: one line per flight, column headers from `lg`. */
export function FlightTable({
  entries,
  params,
}: {
  entries: readonly LogbookListEntry[];
  params: ListParams;
}) {
  return (
    <div role="table" aria-label={useTranslations("Logbook.flights")("title")}>
      <div
        role="row"
        className={`${TABLE_GRID} border-l-3 border-transparent px-3 py-2.5 text-[11.5px] font-semibold tracking-[.06em] text-muted uppercase max-lg:hidden`}
      >
        {COLUMNS.map((column) => (
          <HeaderCell key={column.key} column={column} params={params} />
        ))}
        <span role="columnheader" />
      </div>
      {entries.map((entry) => (
        <FlightRow key={entry.flight.flightId} entry={entry} />
      ))}
    </div>
  );
}
