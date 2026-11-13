import { useTranslations } from "next-intl";
import { PrivateIcon } from "../../ui/icons.ts";
import { STATS_THEMES, type StatsTheme } from "./stats-themes.ts";

/** Sticky bar of the themes: a link to each section of the page; padlock on a locked theme. */
export function ThemeNav({ locked }: { locked: ReadonlySet<StatsTheme["id"]> }) {
  const t = useTranslations("Logbook.stats");
  return (
    <nav
      aria-label={t("themesLabel")}
      className="sticky top-[84px] z-10 -mx-1 flex gap-1 overflow-x-auto rounded-control border border-line bg-surface/95 p-1 backdrop-blur"
    >
      {STATS_THEMES.map(({ id, icon: Icon }) => (
        <a
          key={id}
          href={`#${id}`}
          className="inline-flex flex-none items-center gap-1.5 rounded-inner px-3 py-1.5 text-[13.5px] font-medium text-muted hover:bg-accent/12 hover:text-link"
        >
          <Icon size={15} aria-hidden="true" />
          {t(`themes.${id}.title`)}
          {locked.has(id) && <PrivateIcon size={13} className="text-accent-2" aria-hidden="true" />}
        </a>
      ))}
    </nav>
  );
}
