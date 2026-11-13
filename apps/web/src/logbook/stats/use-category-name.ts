import type { AircraftCategory } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** Name of an aircraft category in the language of the page; « Non classé » for none. */
export function useCategoryName() {
  const categories = useTranslations("Aircraft.categories");
  const t = useTranslations("Logbook.stats");
  return (category: AircraftCategory | null) =>
    category ? categories(category) : t("unclassified");
}
