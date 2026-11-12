import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { HeroBanner } from "../ui/hero-banner.tsx";
import { LiveIcon, LogbookIcon, PlansIcon, TrackerIcon, UsersIcon } from "../ui/icons.ts";
import type { ThemePhotos } from "../ui/photo-background.tsx";

/**
 * Top of the page Découvrir: the photo banner of the public pages, with the way to the plans and
 * to the live map, and what Weems holds in four chips.
 */
export function DiscoverBanner({ photos }: { photos: ThemePhotos }) {
  const t = useTranslations("Discover.banner");
  return (
    <HeroBanner
      photos={photos}
      eyebrow={t("eyebrow")}
      title={t("title")}
      highlight={t("highlight")}
      lead={t("slogan")}
      route={["LFPG", "LFMN"]}
      chips={[
        { icon: TrackerIcon, label: t("chips.tracker") },
        { icon: LogbookIcon, label: t("chips.logbook") },
        { icon: LiveIcon, label: t("chips.live") },
        { icon: UsersIcon, label: t("chips.community") },
      ]}
      actions={
        <>
          <Link
            href="/plans"
            className={`${buttonClass("primary")} min-h-[52px] rounded-box px-5 text-base`}
          >
            <PlansIcon size={20} aria-hidden="true" />
            {t("plans")}
          </Link>
          <Link
            href="/live"
            className={`${buttonClass("ghost")} min-h-[52px] rounded-box px-5 text-base hero-glass`}
          >
            <LiveIcon size={20} aria-hidden="true" />
            {t("live")}
          </Link>
        </>
      }
    />
  );
}
