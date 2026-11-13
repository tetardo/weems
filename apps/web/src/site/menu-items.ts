import {
  DepartureIcon,
  DiscoverIcon,
  FeaturesIcon,
  type IconComponent,
  LiveIcon,
  LogbookIcon,
  PlansIcon,
} from "../ui/icons.ts";

/** Who sees an entry: the logged-in pilot, the visitor without an account, or both. */
type MenuAudience = "pilot" | "visitor" | "everyone";

/** One entry of the main navigation: a page of the site. */
export interface MenuItem {
  readonly href: string;
  /** Key of the label in Site.nav. */
  readonly label: string;
  readonly icon: IconComponent;
  readonly audience: MenuAudience;
  /** "account": on large screens, beside the way in rather than after the logo (Greg, 13/11). */
  readonly placement?: "account";
}

/**
 * Pages of the bar (links after the logo; menu button on phones), the same on every page.
 * Decision 003: at most 5 entries for each audience; later groups (« Ma compagnie », lot 3) open a
 * menu. « Découvrir » and « Fonctionnalités » are for visitors only: a pilot already knows Weems
 * (both stay in the footer). « Mes vols » left the bar (Greg, 13/11): every flight is in the logbook.
 */
const MENU: readonly MenuItem[] = [
  { href: "/discover", label: "discover", icon: DiscoverIcon, audience: "visitor" },
  { href: "/features", label: "features", icon: FeaturesIcon, audience: "visitor" },
  { href: "/logbook", label: "logbook", icon: LogbookIcon, audience: "pilot" },
  { href: "/live", label: "live", icon: LiveIcon, audience: "everyone", placement: "account" },
  {
    href: "/boarding",
    label: "boarding",
    icon: DepartureIcon,
    audience: "everyone",
    placement: "account",
  },
  { href: "/plans", label: "plans", icon: PlansIcon, audience: "everyone" },
];

/** Entries of the menu for a logged-in pilot or for a visitor (all of them on phones). */
export function menuFor(loggedIn: boolean): readonly MenuItem[] {
  const shown: MenuAudience = loggedIn ? "pilot" : "visitor";
  return MENU.filter((item) => item.audience === "everyone" || item.audience === shown);
}

/** Entries after the logo on large screens; the others sit beside the way in. */
export function navFor(loggedIn: boolean): readonly MenuItem[] {
  return menuFor(loggedIn).filter((item) => item.placement !== "account");
}
