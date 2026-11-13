import { type PilotRank, RANK_THRESHOLDS } from "@weems/contrats";
import { useTranslations } from "next-intl";
import { RankInsignia } from "./rank-insignia.tsx";

/**
 * Rank of a pilot beside their founder badge (« Fondateur n° 127 · Commandant »); compact: the
 * insignia alone, its name on hover (Boarding).
 */
export function RankBadge({ rank, compact = false }: { rank: PilotRank; compact?: boolean }) {
  const t = useTranslations("Ranks");
  const name = t(`names.${rank}`);
  const help = t("badgeHelp", { name, ...RANK_THRESHOLDS[rank] });
  if (compact) {
    return (
      <span title={help} className="inline-flex flex-none">
        <RankInsignia rank={rank} size={22} title={name} />
      </span>
    );
  }
  return (
    <span
      title={help}
      className="inline-flex h-6 flex-none items-center gap-1 rounded-tag bg-accent/12 pr-2 pl-1 text-[12px] font-semibold whitespace-nowrap text-link ring-1 ring-accent/35 ring-inset"
    >
      <RankInsignia rank={rank} size={22} />
      {name}
    </span>
  );
}
