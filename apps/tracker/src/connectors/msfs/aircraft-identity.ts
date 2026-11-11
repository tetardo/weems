import type { Airframe, EngineType } from "@weems/contrats";

/**
 * ATC MODEL as an ICAO type designator. MSFS 2020 often gives a translation key such as
 * `TT:ATCCOM.AC_MODEL_B738.0.text` or `ATCCOM.AC_MODEL C172.0.text` (pieges.md): the type is
 * taken out of it. Anything else is kept as the simulator wrote it.
 */
export function icaoTypeOf(model: string): string {
  const key = /AC_MODEL[ _]?([A-Z0-9]{2,4})\./i.exec(model);
  return (key?.[1] ?? model.replace(/^\$\$:/, "")).trim().toUpperCase();
}

/** ENGINE TYPE of the SDK: 0 piston, 1 jet, 2 none, 3 helicopter turbine, 5 turboprop. */
export const ENGINE_TYPES: Readonly<Record<number, EngineType>> = {
  0: "piston",
  1: "jet",
  2: "none",
  3: "helicopterTurbine",
  5: "turboprop",
};

/** Unsupported (4) and unexpected values are unknown. */
export const engineTypeOf = (value: number): EngineType | null => ENGINE_TYPES[value] ?? null;

/** CATEGORY of the SDK: "Airplane" or "Helicopter" for what a pilot flies; anything else unknown. */
export function airframeOf(category: string): Airframe | null {
  const value = category.trim().toLowerCase();
  return value === "airplane" || value === "helicopter" ? value : null;
}
