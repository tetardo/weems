import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { PlanId } from "@weems/contrats";
import { Link } from "../i18n/navigation.ts";
import { ProfileIcon, ShowIcon } from "../ui/icons.ts";
import { LogbookNav } from "./logbook-nav.tsx";

/** Plan of the pilot at the top of the menu, with the way to Pilot Pro for a free pilot. */
function PlanBox({ plan }: { plan: PlanId }) {
  const t = useTranslations("Logbook.plan");
  const free = plan === "pilot_free";
  return (
    <div
      className={`mb-2 rounded-box px-2.5 py-2 text-[12.5px] ${free ? "bg-accent/12" : "bg-accent-2/14"}`}
    >
      {t("label")}{" "}
      <b className={free ? "text-link" : "text-accent-2"}>{t(free ? "free" : "pro")}</b>
      {free && (
        <Link href="/plans" className="block font-semibold text-accent-2">
          {t("upgrade")}
        </Link>
      )}
    </div>
  );
}

/**
 * Frame of the private logbook (spec carnet privé, § 1): menu on the left (plan, pages, public
 * page and settings), tabs under the bar on phones.
 */
export function LogbookShell({ plan, children }: { plan: PlanId; children: ReactNode }) {
  const t = useTranslations("Logbook");
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-12 sm:px-6 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:items-start md:gap-5">
      <aside className="sticky top-24 rounded-panel border border-line bg-surface p-2.5 max-md:hidden">
        <div className="mb-2 border-b border-line px-1.5 pt-1 pb-3">
          <b className="block text-[14px]">{t("title")}</b>
          <span className="text-[12px] text-muted">{t("private")}</span>
        </div>
        <PlanBox plan={plan} />
        <nav aria-label={t("title")} className="flex flex-col gap-0.5">
          <LogbookNav variant="side" />
        </nav>
        <div className="mt-2.5 flex flex-col gap-0.5 border-t border-line pt-2.5 text-muted">
          <Link
            href="/logbook/public"
            className="flex h-10 items-center gap-2.5 rounded-control px-2.5 font-medium hover:text-ink"
          >
            <ShowIcon size={18} aria-hidden="true" />
            {t("public.title")}
          </Link>
          <Link
            href="/settings/profile"
            className="flex h-10 items-center gap-2.5 rounded-control px-2.5 font-medium hover:text-ink"
          >
            <ProfileIcon size={18} aria-hidden="true" />
            {t("settings")}
          </Link>
        </div>
      </aside>
      <nav
        aria-label={t("title")}
        className="mb-3 flex gap-1 rounded-control border border-line bg-surface p-1 md:hidden"
      >
        <LogbookNav variant="tabs" />
      </nav>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
