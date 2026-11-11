import { FlightsIcon, type IconComponent, LiveIcon } from "../ui/icons.ts";

/** One entry of the side menu: a page of the site. */
export interface MenuItem {
  readonly href: string;
  /** Key of the label in Site.nav. */
  readonly label: string;
  readonly icon: IconComponent;
}

/**
 * Pages of the side menu. The estimated final menu, in titled sections (pilot pages,
 * « Ma compagnie » from lot 3, « Compte »), is on the mock-up branch mock/gamelab-menus.
 */
export const MENU: readonly MenuItem[] = [
  { href: "/flights", label: "flights", icon: FlightsIcon },
  { href: "/live", label: "live", icon: LiveIcon },
];
