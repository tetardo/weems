import type { LogbookSummary } from "@weems/contrats";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { BounceIcon, DoneIcon, WarningIcon, type IconComponent } from "../../ui/icons.ts";
import { LockedCard } from "../locked-card.tsx";
import { SummaryCard } from "./summary-card.tsx";

type WorkOn = LogbookSummary["workOn"];

function Row({
  icon: Icon,
  ok,
  title,
  children,
}: {
  icon: IconComponent;
  ok: boolean;
  title: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex gap-3 border-b border-line py-2.5 last:border-b-0">
      <span
        className={`grid size-8 flex-none place-items-center rounded-box ${ok ? "bg-success/12 text-success" : "bg-accent-2/14 text-accent-2"}`}
      >
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <b className="block text-[14px] font-semibold">{title}</b>
        {children && <span className="text-[12.5px] text-muted">{children}</span>}
      </div>
    </li>
  );
}

/** Bounces, flights with alerts, go-arounds over the last flights (key workOnBasic). */
function Rows({ workOn }: { workOn: WorkOn }) {
  const t = useTranslations("Logbook.summary.workOn");
  const alerts = useTranslations("Alerts");
  const { flights, bouncedLandings: bounced, alertFlights } = workOn;
  return (
    <ul className="m-0 list-none p-0">
      <Row
        icon={bounced ? BounceIcon : DoneIcon}
        ok={bounced === 0}
        title={t("bounces", { count: bounced, flights })}
      />
      <Row
        icon={alertFlights ? WarningIcon : DoneIcon}
        ok={alertFlights === 0}
        title={t("alerts", { count: alertFlights })}
      >
        {alertFlights > 0 &&
          `${workOn.alerts.map((a) => alerts(a)).join(", ")} : ${t("alertsHint")}`}
      </Row>
      <Row icon={DoneIcon} ok title={t("goArounds", { count: workOn.goArounds })} />
    </ul>
  );
}

/**
 * « À travailler » (spec carnet privé, § 3): the basic list for everyone, the detailed analysis of
 * the approaches for Pilot Pro (locked preview for a free pilot, « bientôt » for now otherwise).
 */
export function WorkOnCard({ workOn, detailed }: { workOn: WorkOn; detailed: boolean }) {
  const t = useTranslations("Logbook.summary.workOn");
  return (
    <SummaryCard
      icon={WarningIcon}
      title={t("title")}
      aside={t("aside", { flights: workOn.flights })}
    >
      {workOn.flights === 0 ? (
        <p className="m-0 text-[13px] text-muted">{t("empty")}</p>
      ) : (
        <Rows workOn={workOn} />
      )}
      <div className="mt-3">
        {detailed ? (
          <p className="m-0 rounded-box border border-dashed border-line px-3 py-2.5 text-[12.5px] text-muted">
            <b className="text-ink">{t("detailed.title")}</b> · {t("detailed.soon")}
          </p>
        ) : (
          <LockedCard title={t("detailed.title")} text={t("detailed.text")} />
        )}
      </div>
    </SummaryCard>
  );
}
