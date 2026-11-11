import {
  mdiAccountCircleOutline,
  mdiAccountGroupOutline,
  mdiAirplane,
  mdiBookOpenPageVariantOutline,
  mdiCalendarCheckOutline,
  mdiChartLine,
  mdiCogOutline,
  mdiCreditCardOutline,
  mdiDownload,
  mdiMapMarkerPath,
  mdiNotebookOutline,
  mdiRadar,
  mdiViewDashboardOutline,
} from "@mdi/js";

/** One entry of the side menu. `lot`: entry planned for that lot, not built yet (no link). */
export interface MenuItem {
  readonly href: string;
  readonly label: string;
  readonly icon: string;
  readonly lot?: 1 | 2 | 3;
}

export interface MenuSection {
  /** Key of the section title in Site.menu; none for the first section. */
  readonly title?: string;
  readonly items: readonly MenuItem[];
}

/**
 * Mock-up of the final menu (estimate of 11/11/2026, roadmap lots 1 to 3): the pilot's pages,
 * the virtual airline (members only), then the account.
 */
export const MENU: readonly MenuSection[] = [
  {
    items: [
      { href: "/flights", label: "flights", icon: mdiBookOpenPageVariantOutline },
      { href: "/live", label: "live", icon: mdiRadar },
      { href: "/stats", label: "stats", icon: mdiChartLine, lot: 2 },
      { href: "/logbook", label: "logbook", icon: mdiNotebookOutline, lot: 2 },
    ],
  },
  {
    title: "airline",
    items: [
      { href: "/va", label: "vaDashboard", icon: mdiViewDashboardOutline, lot: 3 },
      { href: "/va/fleet", label: "vaFleet", icon: mdiAirplane, lot: 3 },
      { href: "/va/routes", label: "vaRoutes", icon: mdiMapMarkerPath, lot: 3 },
      { href: "/va/pilots", label: "vaPilots", icon: mdiAccountGroupOutline, lot: 3 },
      { href: "/va/bookings", label: "vaBookings", icon: mdiCalendarCheckOutline, lot: 3 },
      { href: "/va/settings", label: "vaSettings", icon: mdiCogOutline, lot: 3 },
    ],
  },
  {
    title: "account",
    items: [
      { href: "/tracker", label: "tracker", icon: mdiDownload, lot: 1 },
      { href: "/account", label: "account", icon: mdiAccountCircleOutline, lot: 1 },
      { href: "/subscription", label: "subscription", icon: mdiCreditCardOutline, lot: 2 },
    ],
  },
];
