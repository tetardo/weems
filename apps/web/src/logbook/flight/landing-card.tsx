import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { ArrivalIcon } from "../../ui/icons.ts";
import { LogbookCard } from "../logbook-card.tsx";
import { TouchdownValue } from "../touchdown-value.tsx";
import type { LandingDetails } from "./landing-details.ts";

function Box({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-box border border-line px-3 py-2">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="text-[18px] font-semibold tabular-nums">{children}</div>
    </div>
  );
}

/** « Atterrissage »: touchdown, load factor, bounces, go-arounds, speed at the touchdown. */
export function LandingCard({
  landing,
  arrival,
}: {
  landing: LandingDetails | null;
  arrival: string | null;
}) {
  const t = useTranslations("Logbook.flight.landing");
  const none = useTranslations("Site")("notMeasured");
  const format = useFormatter();
  return (
    <LogbookCard icon={ArrivalIcon} title={t("title")} aside={arrival} className="h-full">
      {landing ? (
        <div className="grid grid-cols-2 gap-2">
          <Box label={t("touchdown")}>
            {landing.touchdownVs === null ? none : <TouchdownValue vs={landing.touchdownVs} />}
            <span className="text-[13px] font-normal text-muted"> ft/min</span>
          </Box>
          <Box label={t("gForce")}>
            {landing.gForce === null
              ? none
              : `${format.number(landing.gForce, { maximumFractionDigits: 2 })} g`}
          </Box>
          <Box label={t("bounces")}>{landing.bounces}</Box>
          <Box label={t("goArounds")}>{landing.goArounds}</Box>
          <Box label={t("speed")}>
            {landing.ias === null ? none : `${Math.round(landing.ias)} kt`}
          </Box>
        </div>
      ) : (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      )}
    </LogbookCard>
  );
}
