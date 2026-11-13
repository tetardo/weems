import type { Goals } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { Link } from "../../i18n/navigation.ts";
import { TargetIcon } from "../../ui/icons.ts";
import { FinishedCard } from "./finished-card.tsx";
import { GoalDetail } from "./goal-detail.tsx";
import { GoalForm } from "./goal-form.tsx";
import { GoalList } from "./goal-list.tsx";
import { useGoalText } from "./goal-text.ts";
import { SuggestionsCard } from "./suggestions-card.tsx";

interface Props {
  goals: Goals;
  /** `?g=`: the goal shown on the right (else the first). */
  selectedId: string | null;
  /** `?new=1` or `?edit=1`: the form over the page. */
  form: "new" | "edit" | null;
  /** ICAO types the pilot flew, for « Avec quels avions ? ». */
  models: readonly string[];
  now: Date;
}

const NEW = { pathname: "/logbook/goals", query: { new: 1 } };

/** No running goal yet: what a goal is, and the way to the form. */
function Empty() {
  const t = useTranslations("Logbook.goals");
  return (
    <section className="rounded-panel border border-dashed border-line px-5 py-8 text-center">
      <TargetIcon size={28} className="mx-auto text-link" aria-hidden="true" />
      <p className="mx-auto mt-2 max-w-[46ch] text-muted">{t("empty")}</p>
      <Link href={NEW} className={`${buttonClass()} mt-3`}>
        + {t("new")}
      </Link>
    </section>
  );
}

/** Title, what the page does (and the free limit), « Nouvel objectif ». */
function GoalsHeader({ maxActive }: { maxActive: number | null }) {
  const t = useTranslations("Logbook.goals");
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="m-0 text-[1.7em]">{t("title")}</h1>
        <p className="m-0 mt-1 text-muted">
          {t("intro")} {maxActive !== null && t("freeLimit", { count: maxActive })}
        </p>
      </div>
      <Link href={NEW} className={buttonClass()}>
        + {t("new")}
      </Link>
    </header>
  );
}

/** The goal shown, where the form goes back, and the goal a free pilot's new one replaces. */
function pageState(goals: Goals, selectedId: string | null) {
  const selected = goals.active.find((g) => g.goalId === selectedId) ?? goals.active[0] ?? null;
  const full = goals.maxActive !== null && goals.active.length >= goals.maxActive;
  return {
    selected,
    closeHref: selected ? `/logbook/goals?g=${selected.goalId}` : "/logbook/goals",
    replaces: full ? (goals.active.at(-1) ?? null) : null,
  };
}

/**
 * Page Objectifs of the private logbook (maquette v12 B): running goals with their ring on the
 * left, the chosen one followed in detail on the right, then suggestions and finished goals.
 */
export function GoalsPage({ goals, selectedId, form, models, now }: Props) {
  const text = useGoalText();
  const { selected, closeHref, replaces } = pageState(goals, selectedId);
  return (
    <div className="grid gap-4">
      <GoalsHeader maxActive={goals.maxActive} />
      {selected ? (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.35fr)]">
          <GoalList goals={goals.active} selectedId={selected.goalId} />
          <GoalDetail goal={selected} now={now.getTime()} />
        </div>
      ) : (
        <Empty />
      )}
      <div className="grid items-stretch gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <SuggestionsCard suggestions={goals.suggestions} now={now.toISOString()} />
        <FinishedCard goals={goals.finished} />
      </div>
      {form && (
        <GoalForm
          editing={form === "edit" ? selected : null}
          practicesAllowed={goals.goodPracticesAllowed}
          models={models}
          replaces={replaces ? text.title(replaces) : null}
          closeHref={closeHref}
        />
      )}
    </div>
  );
}
