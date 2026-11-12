import type { FeatureGroup } from "@weems/contrats";
import {
  AircraftIcon,
  AnalysisIcon,
  CompanyIcon,
  type IconComponent,
  LogbookIcon,
} from "../ui/icons.ts";

/** One icon per group of the page Fonctionnalités (section titles and summary). */
export const GROUP_ICONS: Record<FeatureGroup, IconComponent> = {
  fly: AircraftIcon,
  logbook: LogbookIcon,
  analysis: AnalysisIcon,
  company: CompanyIcon,
};
