import { useTranslations } from "next-intl";
import { Link } from "../i18n/navigation.ts";
import { PrivateIcon, ShowIcon } from "../ui/icons.ts";

/**
 * Strip above the pilot's own logbook: a preview only they see while the profile is not public,
 * otherwise a link to the public page. Both lead to the profile settings.
 */
export function LogbookNotice({ publicHandle }: { publicHandle: string | null }) {
  const t = useTranslations("Logbook.notice");
  const Icon = publicHandle ? ShowIcon : PrivateIcon;
  const link = "font-semibold text-link hover:underline";
  return (
    <p className="m-0 mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-panel border border-line bg-surface px-4 py-3 text-sm text-muted">
      <span className="mr-auto flex items-center gap-3">
        <Icon size={17} aria-hidden="true" className="flex-none" />
        {publicHandle ? t("public") : t("private")}
      </span>
      {publicHandle && (
        <Link href={`/pilots/${publicHandle}`} className={link}>
          {t("open")}
        </Link>
      )}
      <Link href="/settings/profile" className={link}>
        {publicHandle ? t("settings") : t("publish")}
      </Link>
    </p>
  );
}
