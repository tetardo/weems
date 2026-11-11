import type { CloseReason } from "@weems/contrats";
import { useTranslations } from "next-intl";

/** Pill colours (GameLab tags: border and tinted background in the theme's colours). */
const TONE: Record<CloseReason | "open", string> = {
  open: "border-accent/40 bg-accent/12 text-link",
  normal: "border-success/40 bg-success/12 text-success",
  manual: "border-line text-muted",
  crash: "border-danger/40 bg-danger/12 text-danger",
  interrupted: "border-accent-2/40 bg-accent-2/12 text-accent-2",
  aircraftChanged: "border-line text-muted",
};

/** Completed, interrupted, in progress… (spec site minimal, list). */
export function FlightStatus({ closeReason }: { closeReason: CloseReason | null }) {
  const t = useTranslations("Status");
  const status = closeReason ?? "open";
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-[.85em] whitespace-nowrap ${TONE[status]}`}
    >
      {t(status)}
    </span>
  );
}
