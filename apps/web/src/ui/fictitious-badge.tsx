import { useTranslations } from "next-intl";

/** « Compte fictif » tag: the account was created by the activity simulator (local only). */
export function FictitiousBadge() {
  const t = useTranslations("Fictitious");
  return (
    <span
      title={t("help")}
      className="rounded-full border border-dashed border-muted px-2.5 py-0.5 text-[12px] font-semibold text-muted"
    >
      {t("badge")}
    </span>
  );
}
