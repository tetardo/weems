import {
  AircraftIcon,
  ArrivalIcon,
  CalendarIcon,
  DoneIcon,
  type IconComponent,
} from "../../ui/icons.ts";

export interface StatsTheme {
  id: "activity" | "fleet" | "landings" | "technique";
  icon: IconComponent;
}

/** Themes of the page Statistiques, in the order of the page (maquette B v10). */
export const STATS_THEMES: readonly StatsTheme[] = [
  { id: "activity", icon: CalendarIcon },
  { id: "fleet", icon: AircraftIcon },
  { id: "landings", icon: ArrivalIcon },
  { id: "technique", icon: DoneIcon },
];
