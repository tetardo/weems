import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { STATS_THEMES, type StatsTheme } from "./stats-themes.ts";

/** A theme of the page: icon, title, what it shows, a « Pilot Pro » tag when locked, its cards. */
export function StatsThemeSection({
  id,
  locked = false,
  children,
}: {
  id: StatsTheme["id"];
  locked?: boolean;
  children: ReactNode;
}) {
  const t = useTranslations("Logbook.stats.themes");
  const pro = useTranslations("Logbook.plan");
  const Icon = STATS_THEMES.find((theme) => theme.id === id)?.icon;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-40 gap-4">
      <div className="flex items-center gap-3">
        <span className="grid size-[38px] flex-none place-items-center rounded-box bg-link/12 text-link">
          {Icon && <Icon size={18} aria-hidden="true" />}
        </span>
        <div>
          <h2 id={`${id}-title`} className="m-0 flex items-center gap-2 text-[1.25em]">
            {t(`${id}.title`)}
            {locked && (
              <span className="rounded-tag bg-accent-2/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent-2">
                {pro("pro")}
              </span>
            )}
          </h2>
          <p className="m-0 text-[13px] text-muted">{t(`${id}.sub`)}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
