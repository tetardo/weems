"use client";

import type { AircraftCategory } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CategoryDot } from "../aircraft/category-dot.tsx";
import { categoryCounts } from "./category-filter.ts";
import type { LiveFlights } from "./flights-store.ts";

/**
 * Legend of the live map (idea 4): one button per category present, with its number of flights;
 * a click hides or shows that category. Scrolls sideways on a phone.
 */
export function CategoryLegend({
  flights,
  hidden,
  onToggle,
}: {
  flights: LiveFlights;
  hidden: ReadonlySet<AircraftCategory>;
  onToggle: (category: AircraftCategory) => void;
}) {
  const t = useTranslations("Live.legend");
  const names = useTranslations("Aircraft.categories");
  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex gap-2 overflow-x-auto max-md:flex-nowrap md:flex-wrap"
    >
      {categoryCounts(flights).map(([category, count]) => (
        <button
          key={category}
          type="button"
          aria-pressed={!hidden.has(category)}
          onClick={() => onToggle(category)}
          className="flex min-h-11 flex-none items-center gap-2 rounded-[10px] border border-line bg-surface px-3 text-sm aria-[pressed=false]:text-muted aria-[pressed=false]:line-through aria-[pressed=false]:opacity-60"
        >
          <CategoryDot category={category} />
          {names(category)}
          <span className="text-[12px] text-muted">{count}</span>
        </button>
      ))}
    </div>
  );
}
