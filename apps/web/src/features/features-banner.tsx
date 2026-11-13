import type { PlanCatalog } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { HeroBanner } from "../ui/hero-banner.tsx";
import { DoneIcon, FeaturesIcon, PlansIcon, ProgressIcon } from "../ui/icons.ts";
import type { ThemePhotos } from "../ui/photo-background.tsx";

/**
 * Top of the page Fonctionnalités: the photo banner of the public pages; its chips count what the
 * catalogue holds (available now, coming soon), so they follow it as the rest of the page does.
 */
export function FeaturesBanner({ photos, catalog }: { photos: ThemePhotos; catalog: PlanCatalog }) {
  const t = useTranslations("Features.banner");
  const available = catalog.features.filter((f) => f.availability === "available").length;
  const soon = catalog.features.length - available;
  return (
    <HeroBanner
      photos={photos}
      eyebrow={t("eyebrow")}
      title={t("title")}
      highlight={t("highlight")}
      lead={t("lead")}
      route={["EGLL", "LFBO"]}
      chips={[
        { icon: DoneIcon, label: t("available", { count: available }) },
        { icon: ProgressIcon, label: t("soon", { count: soon }) },
        { icon: FeaturesIcon, label: t("plans", { count: catalog.plans.length }) },
      ]}
      actions={
        <Link
          href="/plans"
          className={`${buttonClass("primary")} min-h-[52px] rounded-box px-5 text-base`}
        >
          <PlansIcon size={20} aria-hidden="true" />
          {t("offers")}
        </Link>
      }
    />
  );
}
