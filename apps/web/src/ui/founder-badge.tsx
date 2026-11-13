import { useTranslations } from "next-intl";
import { FounderIcon } from "./icons.ts";

/**
 * « Pilote fondateur · n° 127 » (offer of the first 500 pilots), or « n° 127 » alone where room
 * is short (Boarding, live map).
 */
export function FounderBadge({ number, compact = false }: { number: number; compact?: boolean }) {
  const t = useTranslations("Founders");
  const size = compact ? "h-5 gap-1 px-1.5 text-[11px]" : "h-6 gap-1.5 px-2 text-[12px]";
  return (
    <span
      title={t("badgeHelp", { number })}
      className={`inline-flex flex-none items-center rounded-tag bg-founder/12 font-semibold whitespace-nowrap text-founder ring-1 ring-founder/45 ring-inset ${size}`}
    >
      <FounderIcon size={compact ? 12 : 14} aria-hidden="true" />
      {compact ? t("badgeShort", { number }) : t("badge", { number })}
    </span>
  );
}
