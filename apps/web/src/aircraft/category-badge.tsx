import type { AircraftClass } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { CATEGORY_TONE } from "./category-tone.ts";

/**
 * Category of a flight's aircraft (spec J4, aircraft categories): a tinted pill, dashed and
 * marked "estimated" when the type is missing from the catalogue. Nothing when unknown.
 */
export function CategoryBadge({ aircraftClass }: { aircraftClass: AircraftClass | null }) {
  const t = useTranslations("Aircraft");
  if (aircraftClass === null) return null;
  const { category, estimated } = aircraftClass;
  const label = t(`categories.${category}`);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[.8em] font-semibold whitespace-nowrap ${CATEGORY_TONE[category]} ${estimated ? "border-dashed bg-transparent" : "border-transparent"}`}
      title={estimated ? t("estimatedHint") : undefined}
    >
      <span aria-hidden className="size-1.5 rounded-[2px] bg-current" />
      {estimated ? t("estimated", { category: label }) : label}
    </span>
  );
}
