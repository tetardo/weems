import { useTranslations } from "next-intl";
import { DoneIcon, WarningIcon } from "../ui/icons.ts";
import { type DiscoverStep, STEP_POINTS, type StepTag } from "./discover-steps.ts";
import { StepIllustration } from "./step-illustrations.tsx";

const TAG_TONE: Record<StepTag["kind"], string> = {
  free: "bg-accent/12 text-link",
  soon: "bg-accent-2/12 text-accent-2",
  plan: "border border-line text-muted",
};

function Tags({ tags }: { tags: readonly StepTag[] }) {
  const t = useTranslations("Discover.tags");
  return (
    <p className="m-0 mt-3 flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.key}
          className={`rounded-tag px-2 py-0.5 text-xs font-semibold ${TAG_TONE[tag.kind]}`}
        >
          {t(tag.key)}
        </span>
      ))}
    </p>
  );
}

/** « Simulation only »: Weems never claims to train pilots for real flights. */
function SimulationNotice() {
  const t = useTranslations("Discover.notice");
  return (
    <p className="m-0 mt-3 flex gap-3 rounded-box border border-line bg-bg px-4 py-3 text-sm text-muted">
      <WarningIcon size={18} className="mt-0.5 flex-none text-accent-2" aria-hidden="true" />
      <span>
        <b className="text-ink">{t("title")}</b> {t("text")}
      </span>
    </p>
  );
}

/**
 * One waypoint of the route: number, title, text, points and tags on one side, the illustration
 * on the other (sides alternate on a computer), the icon on the dashed line in the middle. On a
 * phone, the line and the icons run down the left edge.
 */
export function DiscoverStepRow({ step, index }: { step: DiscoverStep; index: number }) {
  const t = useTranslations("Discover");
  const flipped = index % 2 === 1;
  return (
    <li className="relative grid grid-cols-2 items-center gap-[72px] py-6 max-md:grid-cols-1 max-md:gap-4 max-md:py-4 max-md:pl-14">
      <span className="absolute top-1/2 left-1/2 grid size-11 -translate-1/2 place-items-center rounded-full border-2 border-accent bg-surface text-accent shadow-[0_0_0_6px_var(--wm-surface)] max-md:top-10 max-md:left-[22px]">
        <step.icon size={18} aria-hidden="true" />
      </span>
      <div className={`max-w-[520px] ${flipped ? "md:order-2" : "md:justify-self-end"}`}>
        <p className="m-0 font-mono text-xs font-bold tracking-[.06em] text-muted">
          <span className="sr-only">{t("stepNumber", { number: index + 1 })}</span>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        </p>
        <h2 className="mt-1.5 mb-2 text-2xl max-md:text-xl">{t(`steps.${step.id}.title`)}</h2>
        <p className="m-0 text-muted">{t(`steps.${step.id}.text`)}</p>
        <ul className="m-0 mt-2.5 flex list-none flex-col gap-1.5 p-0 text-sm">
          {STEP_POINTS.map((point) => (
            <li key={point} className="flex gap-2">
              <DoneIcon size={16} className="mt-0.5 flex-none text-success" aria-hidden="true" />
              {t(`steps.${step.id}.${point}`)}
            </li>
          ))}
        </ul>
        {step.simulationNotice && <SimulationNotice />}
        <Tags tags={step.tags} />
      </div>
      <div className={`flex ${flipped ? "md:order-1 md:justify-end" : ""}`}>
        <StepIllustration id={step.id} index={index} />
      </div>
    </li>
  );
}
