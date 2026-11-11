import type { CloseReason } from "@weems/contrats";
import { useTranslations } from "next-intl";

const TONE: Record<CloseReason | "open", string> = {
  open: "bg-sky-100 text-sky-900",
  normal: "bg-emerald-100 text-emerald-900",
  manual: "bg-slate-100 text-slate-800",
  crash: "bg-red-100 text-red-900",
  interrupted: "bg-amber-100 text-amber-900",
  aircraftChanged: "bg-slate-100 text-slate-800",
};

/** Completed, interrupted, in progress… (spec site minimal, list). */
export function FlightStatus({ closeReason }: { closeReason: CloseReason | null }) {
  const t = useTranslations("Status");
  const status = closeReason ?? "open";
  return <span className={`rounded px-1.5 py-0.5 text-xs ${TONE[status]}`}>{t(status)}</span>;
}
