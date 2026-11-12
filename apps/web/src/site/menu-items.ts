import { FlightsIcon, type IconComponent, LiveIcon } from "../ui/icons.ts";

/** One entry of the main navigation: a page of the site. */
export interface MenuItem {
  readonly href: string;
  /** Key of the label in Site.nav. */
  readonly label: string;
  readonly icon: IconComponent;
  /** Shown to visitors too (page open without an account). */
  readonly open: boolean;
}

/**
 * Pages of the bar (links after the logo; menu button on phones), the same on every page.
 * Decision 003: at most 5 entries here; later groups (« Ma compagnie », lot 3) open a menu.
 */
const MENU: readonly MenuItem[] = [
  { href: "/flights", label: "flights", icon: FlightsIcon, open: false },
  { href: "/live", label: "live", icon: LiveIcon, open: true },
];

/** Entries a pilot sees: all of them when logged in, the open pages otherwise. */
export function menuFor(loggedIn: boolean): readonly MenuItem[] {
  return loggedIn ? MENU : MENU.filter((item) => item.open);
}
