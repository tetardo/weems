import { FlightsIcon, type IconComponent, LiveIcon, ProfileIcon } from "../ui/icons.ts";

/** One entry of the side menu: a page of the site. */
export interface MenuItem {
  readonly href: string;
  /** Key of the label in Site.nav. */
  readonly label: string;
  readonly icon: IconComponent;
}

/** A group of the side menu; `title`: key in Site.nav, none for the first group. */
export interface MenuSection {
  readonly title: string | null;
  readonly items: readonly MenuItem[];
}

/**
 * Pages of the side menu, in titled sections. The estimated final menu (pilot pages, « Ma
 * compagnie » from lot 3, « Compte ») is on the mock-up branch mock/gamelab-menus.
 */
export const MENU: readonly MenuSection[] = [
  {
    title: null,
    items: [
      { href: "/flights", label: "flights", icon: FlightsIcon },
      { href: "/live", label: "live", icon: LiveIcon },
    ],
  },
  {
    title: "account",
    items: [{ href: "/settings/profile", label: "profile", icon: ProfileIcon }],
  },
];
