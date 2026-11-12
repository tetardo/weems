import {
  FlightsIcon,
  LogbookIcon,
  StatsIcon,
  TargetIcon,
  type IconComponent,
} from "../ui/icons.ts";

export interface LogbookPage {
  href: string;
  label: "summary" | "flights" | "stats" | "goals";
  icon: IconComponent;
  /** Not coded yet (spec carnet privé, § 8): shown greyed with « bientôt ». */
  soon: boolean;
}

/** Pages of the private logbook, in the order of the menu (spec carnet privé). */
export const LOGBOOK_PAGES: readonly LogbookPage[] = [
  { href: "/logbook", label: "summary", icon: LogbookIcon, soon: false },
  { href: "/logbook/flights", label: "flights", icon: FlightsIcon, soon: false },
  { href: "/logbook/stats", label: "stats", icon: StatsIcon, soon: true },
  { href: "/logbook/goals", label: "goals", icon: TargetIcon, soon: true },
];

/** The page of the menu shown as current: exact match (the Résumé is the parent of the others). */
export const isLogbookPage = (pathname: string, href: string) =>
  href === "/logbook" ? pathname === href : pathname.startsWith(href);
