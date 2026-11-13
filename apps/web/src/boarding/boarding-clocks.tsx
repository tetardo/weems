"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { zoneCity } from "./board-rows.ts";

const hhmm = (date: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone }).format(date);

/** UTC and local time, as in a terminal; empty until the browser knows the time. */
export function BoardingClocks() {
  const t = useTranslations("Boarding");
  const [now, setNow] = useState<Date | null>(null);
  const [zone, setZone] = useState("UTC");
  useEffect(() => {
    setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = (label: string, timeZone: string, tone: string) => (
    <span className="flex h-9 items-center gap-2 rounded-box border border-line bg-surface px-3">
      <span className="text-[10px] font-semibold tracking-[.14em] text-muted uppercase">
        {label}
      </span>
      <time className={`font-mono text-lg font-bold ${tone}`} suppressHydrationWarning>
        {now ? hhmm(now, timeZone) : "--:--"}
      </time>
    </span>
  );
  return (
    <div className="flex gap-2" aria-label={t("clocks")}>
      {clock(t("utc"), "UTC", "text-board-ink")}
      {zone !== "UTC" && clock(zoneCity(zone), zone, "text-ink")}
    </div>
  );
}
