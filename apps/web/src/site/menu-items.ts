import { FlightsIcon, type IconComponent, LiveIcon } from "../ui/icons.ts";

/** One entry of the main navigation: a page of the site. */
export interface MenuItem {
  readonly href: string;
  /** Key of the label in Site.nav. */
  readonly label: string;
  readonly icon: IconComponent;
}

/**
 * Pages of the floating bar (tabs on large screens) and of the dock at the bottom on phones.
 * Decision 003: at most 5 entries here; later groups (« Ma compagnie », lot 3) open a menu.
 */
export const MENU: readonly MenuItem[] = [
  { href: "/flights", label: "flights", icon: FlightsIcon },
  { href: "/live", label: "live", icon: LiveIcon },
];
