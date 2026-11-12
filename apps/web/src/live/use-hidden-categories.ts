"use client";

import type { AircraftCategory } from "@weems/contrats";
import { useState } from "react";

/** Categories the spectator hid with the legend; all shown when the page opens. */
export function useHiddenCategories(): [
  ReadonlySet<AircraftCategory>,
  (category: AircraftCategory) => void,
] {
  const [hidden, setHidden] = useState<ReadonlySet<AircraftCategory>>(new Set());
  const toggle = (category: AircraftCategory) =>
    setHidden((current) => {
      const next = new Set(current);
      if (!next.delete(category)) next.add(category);
      return next;
    });
  return [hidden, toggle];
}
