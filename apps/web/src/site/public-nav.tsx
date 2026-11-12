import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { AircraftIcon, LiveIcon } from "../ui/icons.ts";

/** Links of the public bar (spec J4 accueil): « Découvrir Weems » leads to the home page for now. */
export const PUBLIC_LINKS = [
  { href: "/", label: "discover", icon: AircraftIcon },
  { href: "/live", label: "live", icon: LiveIcon },
] as const;

/** Group of links after the logo, on large screens (phones: the menu, public-menu.tsx). */
export function PublicNav() {
  const t = useTranslations("Site.public");
  return (
    <nav aria-label={t("nav")} className="mr-auto ml-2 max-md:hidden">
      <ul className="flex gap-0.5 rounded-xl border border-line bg-bg/60 p-1">
        {PUBLIC_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex h-9 items-center gap-2 rounded-[9px] px-3.5 text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              <link.icon size={17} aria-hidden="true" />
              {t(link.label)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
