import type { AircraftCategory } from "@weems/contrats";

/** Pill colours of each aircraft category (theme colours --wm-cat-*, src/app/global.css). */
export const CATEGORY_TONE: Readonly<Record<AircraftCategory, string>> = {
  light: "bg-cat-light/14 text-cat-light border-cat-light",
  turboprop: "bg-cat-turboprop/14 text-cat-turboprop border-cat-turboprop",
  businessJet: "bg-cat-business-jet/14 text-cat-business-jet border-cat-business-jet",
  regionalJet: "bg-cat-regional-jet/14 text-cat-regional-jet border-cat-regional-jet",
  narrowBody: "bg-cat-narrow-body/14 text-cat-narrow-body border-cat-narrow-body",
  wideBody: "bg-cat-wide-body/14 text-cat-wide-body border-cat-wide-body",
  helicopter: "bg-cat-helicopter/14 text-cat-helicopter border-cat-helicopter",
  other: "bg-cat-other/14 text-cat-other border-cat-other",
};

/** Solid fill of each category: dots, bars and legends. */
export const CATEGORY_FILL: Readonly<Record<AircraftCategory, string>> = {
  light: "bg-cat-light",
  turboprop: "bg-cat-turboprop",
  businessJet: "bg-cat-business-jet",
  regionalJet: "bg-cat-regional-jet",
  narrowBody: "bg-cat-narrow-body",
  wideBody: "bg-cat-wide-body",
  helicopter: "bg-cat-helicopter",
  other: "bg-cat-other",
};
