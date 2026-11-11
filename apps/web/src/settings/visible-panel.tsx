import { useTranslations } from "next-intl";
import { CardBox } from "../ui/card-box.tsx";

const SHOWN = ["identity", "networks", "stats", "flights"] as const;
const NEVER = ["email", "simbrief", "private", "reviews"] as const;

/** Reminder of what the public profile shows, and what it never shows (spec J4). */
export function VisiblePanel() {
  const t = useTranslations("Settings.visible");
  return (
    <CardBox>
      <h2 className="mt-0 mb-3 text-[1.15em]">{t("title")}</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm">
        {SHOWN.map((key) => (
          <li key={key} className="relative pl-6.5">
            <span aria-hidden="true" className="absolute left-0 font-bold text-success">
              ✓
            </span>
            {t(`shown.${key}`)}
          </li>
        ))}
        {NEVER.map((key) => (
          <li key={key} className="relative pl-6.5 text-muted">
            <span aria-hidden="true" className="absolute left-0 font-bold text-danger">
              ✗
            </span>
            {t(`never.${key}`)}
          </li>
        ))}
      </ul>
    </CardBox>
  );
}
