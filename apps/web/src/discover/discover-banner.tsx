import { useTranslations } from "next-intl";
import { buttonClass } from "@weems/ui";
import { Link } from "../i18n/navigation.ts";
import { PlansIcon } from "../ui/icons.ts";
import { PhotoBackground, type ThemePhotos } from "../ui/photo-background.tsx";

/**
 * Top of the page Découvrir: the photo of the home page (set in the console, Personnalisation) in
 * a rounded card, with the title, the slogan and the way to the plans written on it (on a phone,
 * in a glass panel at the bottom: the veil alone does not keep the text readable over the photo).
 */
export function DiscoverBanner({ photos }: { photos: ThemePhotos }) {
  const t = useTranslations("Discover.banner");
  return (
    <section className="relative overflow-hidden rounded-hero text-hero-ink shadow-floating">
      <PhotoBackground photos={photos} phoneVeil={false} />
      <div className="relative flex min-h-[420px] flex-col justify-center px-12 py-14 max-md:min-h-[560px] max-md:justify-end max-md:p-3">
        <div className="flex flex-col gap-5 max-md:gap-3 max-md:rounded-box max-md:p-4 max-md:hero-glass">
          <p className="m-0 text-xs font-semibold tracking-[.08em] text-hero-muted uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="m-0 max-w-[620px] text-[52px] leading-[1.05] tracking-[-.02em] max-md:text-[30px]">
            {t("title")}
          </h1>
          <p className="m-0 max-w-[540px] text-[18px] text-hero-muted max-md:text-base">
            {t("slogan")}
          </p>
          <p className="m-0">
            <Link
              href="/plans"
              className={`${buttonClass("primary")} min-h-[52px] rounded-box px-5 text-base`}
            >
              <PlansIcon size={20} aria-hidden="true" />
              {t("plans")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
