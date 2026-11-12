import { useTranslations } from "next-intl";

/** End of the page Découvrir: one centred slogan that makes the visitor want to start. */
export function DiscoverClosing() {
  const t = useTranslations("Discover.closing");
  return (
    <section className="mx-auto mt-14 mb-4 max-w-[760px] text-center max-md:mt-10">
      <p className="m-0 font-title text-[44px] leading-[1.1] font-bold tracking-[-.02em] max-md:text-[30px]">
        {t("title")}
      </p>
      <p className="m-0 mt-3 text-lg text-muted max-md:text-base">{t("text")}</p>
    </section>
  );
}
