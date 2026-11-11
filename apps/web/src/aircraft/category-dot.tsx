import type { AircraftCategory } from "@weems/contrats";
import { CATEGORY_FILL } from "./category-tone.ts";

/** Small square in the colour of a category, before its name in lists and legends. */
export function CategoryDot({ category }: { category: AircraftCategory }) {
  return (
    <span aria-hidden className={`size-2.5 flex-none rounded-[3px] ${CATEGORY_FILL[category]}`} />
  );
}
