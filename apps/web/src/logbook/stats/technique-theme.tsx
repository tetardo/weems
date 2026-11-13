import type { LogbookStats } from "@weems/contrats";
import { useFormatter, useTranslations } from "next-intl";
import { PHASE_COLORS } from "../../flight/phase-colors.ts";
import { formatDuration } from "../../format/flight-format.ts";
import { DoneIcon, StatsIcon } from "../../ui/icons.ts";
import { LockedCard } from "../locked-card.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { MeterRow } from "./meter-row.tsx";
import { StatsThemeSection } from "./stats-theme.tsx";
import { useCategoryName } from "./use-category-name.ts";

type PhaseTime = NonNullable<LogbookStats["phaseTime"]>;
type Practices = NonNullable<LogbookStats["goodPractices"]>;

/** Share kept from which a practice is shown in green, else orange. */
const GOOD_FROM = 0.85;

function PhaseBar({ phaseTime }: { phaseTime: PhaseTime }) {
  const phases = useTranslations("Phases");
  return (
    <>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full">
        {phaseTime.phases.map(({ phase, seconds }) => (
          <i
            key={phase}
            title={`${phases(phase)} : ${formatDuration(seconds)}`}
            className="block h-full"
            style={{ flexGrow: seconds, flexBasis: 0, background: PHASE_COLORS[phase] }}
          />
        ))}
      </div>
      <ul className="m-0 mt-3 grid list-none grid-cols-2 gap-x-4 gap-y-1 p-0 text-[12.5px]">
        {phaseTime.phases.map(({ phase, seconds }) => (
          <li key={phase} className="flex items-center gap-1.5">
            <i
              className="size-2 flex-none rounded-full"
              style={{ background: PHASE_COLORS[phase] }}
            />
            <span className="truncate">{phases(phase)}</span>
            <b className="ml-auto font-semibold tabular-nums">{formatDuration(seconds)}</b>
          </li>
        ))}
      </ul>
    </>
  );
}

function PhaseCard({ phaseTime }: { phaseTime: LogbookStats["phaseTime"] }) {
  const t = useTranslations("Logbook.stats.technique");
  const name = useCategoryName();
  const aside = phaseTime
    ? t("phaseAside", { category: name(phaseTime.category), count: phaseTime.flights })
    : undefined;
  return (
    <LogbookCard icon={StatsIcon} title={t("phaseTime")} aside={aside}>
      {phaseTime === null && (
        <LockedCard title={t("phaseLockedTitle")} text={t("phaseLockedText")} />
      )}
      {phaseTime?.phases.length === 0 && (
        <p className="m-0 text-[13px] text-muted">{t("noPhases")}</p>
      )}
      {phaseTime && phaseTime.phases.length > 0 && <PhaseBar phaseTime={phaseTime} />}
    </LogbookCard>
  );
}

function PracticeList({ practices }: { practices: Practices }) {
  const t = useTranslations("Logbook.stats.technique.practices");
  const format = useFormatter();
  return (
    <ul className="m-0 list-none p-0">
      {practices.map(({ practice, share }) => (
        <MeterRow
          key={practice}
          label={t(practice)}
          value={share === null ? t("notMeasured") : format.number(share, { style: "percent" })}
          ratio={share ?? 0}
          fill={(share ?? 0) >= GOOD_FROM ? "bg-success" : "bg-accent-2"}
        />
      ))}
    </ul>
  );
}

function PracticesCard({ practices }: { practices: LogbookStats["goodPractices"] }) {
  const t = useTranslations("Logbook.stats.technique");
  return (
    <LogbookCard
      icon={DoneIcon}
      title={t("goodPractices")}
      aside={practices ? t("provisional") : undefined}
    >
      {practices === null ? (
        <LockedCard title={t("practicesLockedTitle")} text={t("practicesLockedText")} />
      ) : (
        <PracticeList practices={practices} />
      )}
    </LogbookCard>
  );
}

/** Theme Technique (Pilot Pro): mean time per phase and good practices. */
export function TechniqueTheme({ stats }: { stats: LogbookStats }) {
  return (
    <StatsThemeSection
      id="technique"
      locked={stats.phaseTime === null && stats.goodPractices === null}
    >
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PhaseCard phaseTime={stats.phaseTime} />
        <PracticesCard practices={stats.goodPractices} />
      </div>
    </StatsThemeSection>
  );
}
