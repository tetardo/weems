import { useTranslations } from "next-intl";
import { DoneIcon, WarningIcon } from "../ui/icons.ts";
import type { StepId } from "./discover-steps.ts";
import { IllustrationStage } from "./illustration-stage.tsx";
import { StepScene } from "./step-scenes.tsx";
import {
  Chip,
  ChipRow,
  Highlight,
  IllustrationCard,
  IllustrationHead,
} from "./illustration-parts.tsx";

/** Phases of the fictitious flight: done, current, to come (12 phases of the tracker). */
const PHASES = Array.from({ length: 12 }, (_, i) => (i < 5 ? "done" : i === 5 ? "now" : "next"));
const PHASE_TONE = { done: "bg-accent", now: "bg-accent-2", next: "bg-line" } as const;
/** Fictitious average touchdown, month after month (% of the first). */
const TOUCHDOWNS = [92, 85, 78, 70, 64, 60, 52, 48, 44, 40, 38, 36];

function TrackerScreen() {
  const t = useTranslations("Discover.illustration");
  return (
    <IllustrationCard>
      <IllustrationHead
        left={
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" />
            {t("connected")}
          </span>
        }
        right={<Chip mono>REC 01:42</Chip>}
      />
      <ChipRow>
        <Chip>{t("aircraft")}</Chip>
        <Chip mono>LFPG → LEBL</Chip>
        <Chip>{t("cruise")}</Chip>
      </ChipRow>
      <div className="mt-3 flex gap-[3px]">
        {PHASES.map((phase, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-tag ${PHASE_TONE[phase]}`} />
        ))}
      </div>
      <p className="mt-1.5 mb-0 text-muted">{t("phase")}</p>
    </IllustrationCard>
  );
}

function FlightScreen() {
  const t = useTranslations("Discover.illustration");
  const profile = "M0 64 L30 64 L70 18 L230 14 L270 52 L300 64";
  return (
    <IllustrationCard>
      <IllustrationHead
        left={<span className="font-mono">LFPG → LEBL</span>}
        right={<span className="font-normal text-muted">{t("duration")}</span>}
      />
      <svg viewBox="0 0 300 70" className="mt-2 h-[70px] w-full">
        <path d={`${profile} V70 H0Z`} className="fill-accent/12" />
        <path d={profile} fill="none" strokeWidth="2.5" className="stroke-accent" />
      </svg>
      <ChipRow>
        <Chip>
          {t("touchdown")} <b className="font-mono text-ink">{t("touchdownValue")}</b>
        </Chip>
        <Chip>{t("bounces")}</Chip>
        <Chip>{t("fuel")}</Chip>
      </ChipRow>
    </IllustrationCard>
  );
}

const PILOTS = [
  ["G", "bg-cat-narrow-body"],
  ["H", "bg-cat-turboprop"],
  ["T", "bg-cat-light"],
  ["+24", "bg-cat-business-jet"],
] as const;
/** Fictitious trails on the live map, each with the pilot flying it (« you » first). */
const TRAILS = [
  ["M20 60 Q120 0 220 40", "stroke-accent", 140, 27, "fill-accent", "you"],
  ["M60 20 Q160 70 280 30", "stroke-accent-2", 190, 52, "fill-accent-2", "pilotHugo"],
  ["M10 30 Q90 75 170 60", "stroke-success", 110, 64, "fill-success", "pilotTheo"],
] as const;

function LiveScreen() {
  const t = useTranslations("Discover.illustration");
  return (
    <IllustrationCard>
      <IllustrationHead
        left={
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-board-live" />
            {t("live")}
          </span>
        }
        right={
          <span className="flex">
            {PILOTS.map(([initial, tone]) => (
              <span
                key={initial}
                className={`-ml-2 grid size-7 place-items-center rounded-full border-2 border-bg font-title text-[11px] text-on-accent first:ml-0 ${tone}`}
              >
                {initial}
              </span>
            ))}
          </span>
        }
      />
      <svg viewBox="0 0 300 80" className="mt-2 h-20 w-full">
        {TRAILS.map(([path, stroke, x, y, fill, pilot]) => (
          <g key={path}>
            <path d={path} fill="none" strokeDasharray="4 4" className={stroke} />
            <circle cx={x} cy={y} r="4" className={fill} />
            <text x={x + 8} y={y - 6} className={`text-[10px] font-semibold ${fill}`}>
              {t(pilot)}
            </text>
          </g>
        ))}
      </svg>
    </IllustrationCard>
  );
}

function FirstSteps() {
  const t = useTranslations("Discover.illustration");
  const steps = ["signup", "install", "fly"] as const;
  return (
    <IllustrationCard>
      <ol className="m-0 flex list-none flex-col gap-2 p-0">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <b className="grid size-[22px] place-items-center rounded-full bg-accent/12 text-xs text-link">
              {i + 1}
            </b>
            {t(step)}
            {i === steps.length - 1 && (
              <span className="ml-auto">
                <Highlight>{t("done")}</Highlight>
              </span>
            )}
          </li>
        ))}
      </ol>
    </IllustrationCard>
  );
}

const APPROACH = [
  ["stable", true],
  ["speed", true],
  ["sinkRate", false],
  ["zone", true],
] as const;

function ApproachScreen() {
  const t = useTranslations("Discover.illustration");
  return (
    <IllustrationCard>
      <IllustrationHead left={t("approach")} />
      <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
        {APPROACH.map(([check, ok]) => (
          <li key={check} className="flex items-center gap-2">
            {ok ? (
              <DoneIcon size={16} className="text-success" />
            ) : (
              <WarningIcon size={16} className="text-accent-2" />
            )}
            {t(check)}
          </li>
        ))}
      </ul>
    </IllustrationCard>
  );
}

function ProgressScreen() {
  const t = useTranslations("Discover.illustration");
  return (
    <IllustrationCard>
      <IllustrationHead left={t("average")} right={<Highlight>{t("trend")}</Highlight>} />
      <div className="mt-2.5 flex h-16 items-end gap-[5px]">
        {TOUCHDOWNS.map((height, i) => (
          <span
            key={i}
            className="flex-1 rounded-t-tag bg-accent/85"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-muted">
        <span>{t("from")}</span>
        <span>{t("to")}</span>
      </div>
    </IllustrationCard>
  );
}

const ILLUSTRATIONS: Record<StepId, () => React.JSX.Element> = {
  tracker: TrackerScreen,
  followUp: FlightScreen,
  community: LiveScreen,
  simplicity: FirstSteps,
  training: ApproachScreen,
  progress: ProgressScreen,
};

/** The fictitious screen shown beside a step, under its scene, on its soft shape, with a note that explains it. */
export function StepIllustration({ id, index }: { id: StepId; index: number }) {
  const t = useTranslations("Discover.illustration.notes");
  const Illustration = ILLUSTRATIONS[id];
  return (
    <IllustrationStage index={index} note={t(id)} scene={<StepScene id={id} />}>
      <Illustration />
    </IllustrationStage>
  );
}
