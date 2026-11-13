"use client";

import { useTranslations } from "next-intl";
import { CloseIcon } from "../ui/icons.ts";

/** The aircraft type the boards are cut to (clicked in a row); × shows every aircraft again. */
export function AircraftChip({ type, onClear }: { type: string; onClear: () => void }) {
  const t = useTranslations("Boarding.filter");
  return (
    <button
      type="button"
      onClick={onClear}
      title={t("aircraftClear")}
      className="flex h-7 items-center gap-1.5 rounded-control border border-accent bg-accent/15 px-2 font-mono text-xs font-semibold text-ink"
    >
      {type}
      <CloseIcon size={13} aria-hidden="true" />
      <span className="sr-only">{t("aircraftClear")}</span>
    </button>
  );
}
