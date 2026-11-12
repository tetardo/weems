import type { LandingVerdict } from "@weems/contrats";
import { useTranslations } from "next-intl";

const TONES: Record<LandingVerdict, string> = {
  clean: "bg-success/12 text-success",
  firm: "bg-accent-2/14 text-accent-2",
  bounce: "bg-accent-2/14 text-accent-2",
  nonCompliant: "bg-danger/12 text-danger",
  noLanding: "bg-line text-muted",
};

/** Left edge of a line of the list, in the colour of its verdict. */
export const VERDICT_BORDERS: Record<LandingVerdict, string> = {
  clean: "border-success",
  firm: "border-accent-2",
  bounce: "border-accent-2",
  nonCompliant: "border-danger",
  noLanding: "border-line",
};

/** Verdict of a flight: Propre, Ferme, Rebond, Non conforme, Sans atterrissage. */
export function VerdictChip({ verdict }: { verdict: LandingVerdict }) {
  const t = useTranslations("Logbook.verdicts");
  return (
    <span
      className={`rounded-tag px-1.5 py-0.5 text-[11.5px] font-semibold whitespace-nowrap ${TONES[verdict]}`}
    >
      {t(verdict)}
    </span>
  );
}
