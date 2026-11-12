import { AircraftCategory, type PilotRoutes } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CATEGORY_FILL } from "../aircraft/category-tone.ts";

/** Legend of the map of a profile: the categories of its routes only, and what the width says. */
export function RoutesLegend({ routes }: { routes: PilotRoutes["routes"] }) {
  const t = useTranslations("Profile.map");
  const categories = useTranslations("Aircraft.categories");
  const shown = new Set(routes.map((route) => route.category));
  const flown = AircraftCategory.options.filter((category) => shown.has(category));
  return (
    <div className="absolute bottom-3 left-3.5 flex max-w-[calc(100%-28px)] flex-wrap gap-x-3.5 gap-y-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-[12.5px] text-muted">
      {flown.map((category) => (
        <span key={category} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <i aria-hidden className={`h-[3px] w-3.5 rounded-sm ${CATEGORY_FILL[category]}`} />
          {categories(category)}
        </span>
      ))}
      <span className="whitespace-nowrap">{t("width")}</span>
    </div>
  );
}
