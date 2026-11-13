import type { AircraftCategory } from "@weems/contrats";
import { familyOf, SHAPES } from "../live/aircraft-shapes.ts";
import { CATEGORY_TEXT } from "./category-tone.ts";

/** Silhouette of the live map in the colour of the category (lists and boards). */
export function CategorySilhouette({ category }: { category: AircraftCategory | null }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={`size-4 flex-none fill-current ${category ? CATEGORY_TEXT[category] : "text-board-muted"}`}
    >
      <path d={SHAPES[familyOf(category)]} />
    </svg>
  );
}
