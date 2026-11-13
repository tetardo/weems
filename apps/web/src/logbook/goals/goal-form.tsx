"use client";

import {
  AircraftCategory,
  GOAL_KINDS,
  GOAL_WINDOWS,
  GOOD_PRACTICES,
  type GoalKind,
  type GoalView,
  type GoalWindow,
} from "@weems/contrats";
import { Button, buttonClass, Select, TextInput } from "@weems/ui";
import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Link } from "../../i18n/navigation.ts";
import { CloseIcon, PrivateIcon } from "../../ui/icons.ts";
import { type GoalFormState, saveGoalAction } from "./goal-actions.ts";
import { fieldOfAircraft } from "./goal-form-data.ts";

type Definition = GoalView["definition"];

const DEFAULT: Definition = {
  kind: "hours",
  target: 20,
  threshold: null,
  practice: null,
  aircraft: null,
  window: "month",
  until: null,
  recurring: false,
};
const STEP = "mb-2 text-[13px] font-semibold";

/** 1. Quoi ? The eight kinds; « Bonnes pratiques » locked without Pilot Pro. */
function KindChoice({
  kind,
  onChange,
  practicesAllowed,
}: {
  kind: GoalKind;
  onChange: (k: GoalKind) => void;
  practicesAllowed: boolean;
}) {
  const t = useTranslations("Logbook.goals.kinds");
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {GOAL_KINDS.map((value) => {
        const locked = value === "goodPractices" && !practicesAllowed;
        return (
          <label
            key={value}
            className={`cursor-pointer rounded-box border px-3 py-2.5 has-checked:border-accent has-checked:bg-accent/8 ${locked ? "cursor-not-allowed opacity-50" : "border-line"}`}
          >
            <input
              type="radio"
              name="kind"
              value={value}
              checked={kind === value}
              disabled={locked}
              onChange={() => onChange(value)}
              className="sr-only"
            />
            <span className="flex items-center gap-1 text-[13.5px] font-semibold">
              {t(`${value}.label`)}
              {locked && <PrivateIcon size={13} aria-label="Pilot Pro" />}
            </span>
            <span className="block text-[12px] text-muted">{t(`${value}.example`)}</span>
          </label>
        );
      })}
    </div>
  );
}

/** 2. Cible: the number, and the threshold or the practice of the kinds that need one. */
function TargetFields({ kind, goal }: { kind: GoalKind; goal: Definition }) {
  const t = useTranslations("Logbook.goals.form");
  const practices = useTranslations("Logbook.stats.technique.practices");
  return (
    <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
      <div className="w-28">
        <TextInput
          name="target"
          type="number"
          min={1}
          step="any"
          required
          defaultValue={goal.target}
          aria-label={t("target")}
        />
      </div>
      <span className="text-muted">{t(`units.${kind}`)}</span>
      {kind === "softLandings" && (
        <>
          <div className="w-28">
            <TextInput
              name="threshold"
              type="number"
              min={10}
              max={2000}
              required
              defaultValue={goal.threshold ?? 150}
              aria-label={t("threshold")}
            />
          </div>
          <span className="text-muted">ft/min</span>
        </>
      )}
      {kind === "goodPractices" && (
        <Select
          name="practice"
          defaultValue={goal.practice ?? "speed250"}
          aria-label={t("practice")}
        >
          {GOOD_PRACTICES.map((p) => (
            <option key={p} value={p}>
              {practices(p)}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}

/** 3. Avec quels avions ? Every aircraft, a category, or a type the pilot flew. */
function AircraftField({ goal, models }: { goal: Definition; models: readonly string[] }) {
  const t = useTranslations("Logbook.goals.form");
  const categories = useTranslations("Aircraft.categories");
  return (
    <Select
      name="aircraft"
      defaultValue={fieldOfAircraft(goal.aircraft)}
      aria-label={t("aircraft")}
      className="w-full"
    >
      <option value="">{t("allAircraft")}</option>
      <optgroup label={t("categories")}>
        {AircraftCategory.options.map((c) => (
          <option key={c} value={`category:${c}`}>
            {categories(c)}
          </option>
        ))}
      </optgroup>
      {models.length > 0 && (
        <optgroup label={t("models")}>
          {models.map((m) => (
            <option key={m} value={`model:${m}`}>
              {m}
            </option>
          ))}
        </optgroup>
      )}
    </Select>
  );
}

/** 4. Jusqu'à quand ? and « Recommencer à chaque période ». */
function WindowFields({ goal, kind }: { goal: Definition; kind: GoalKind }) {
  const t = useTranslations("Logbook.goals.form");
  const [window, setWindow] = useState<GoalWindow>(goal.window);
  const windows = GOAL_WINDOWS.filter((w) => kind !== "regularity" || w !== "none");
  return (
    <>
      <div className="inline-flex flex-wrap rounded-box border border-line p-0.5">
        {windows.map((value) => (
          <label
            key={value}
            className="cursor-pointer rounded-control px-3 py-1.5 text-[13.5px] has-checked:bg-accent/12 has-checked:font-semibold has-checked:text-link"
          >
            <input
              type="radio"
              name="window"
              value={value}
              checked={window === value}
              onChange={() => setWindow(value)}
              className="sr-only"
            />
            {t(`windows.${value}`)}
          </label>
        ))}
      </div>
      {window === "date" && (
        <div className="mt-2 w-48">
          <TextInput
            name="until"
            type="date"
            required
            defaultValue={goal.until ?? ""}
            aria-label={t("until")}
          />
        </div>
      )}
      {(window === "week" || window === "month") && (
        <label className="mt-3 flex items-center gap-2 text-[13.5px]">
          <input
            type="checkbox"
            name="recurring"
            defaultChecked={goal.recurring}
            className="size-4 accent-accent"
          />
          {t("recurring")}
        </label>
      )}
    </>
  );
}

function FormHeader({ title, closeHref }: { title: string; closeHref: string }) {
  const t = useTranslations("Logbook.goals.form");
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="m-0 font-title text-[22px]">{title}</h2>
      <Link href={closeHref} aria-label={t("cancel")} className="text-muted hover:text-ink">
        <CloseIcon size={20} />
      </Link>
    </div>
  );
}

/** The goal a free pilot's new one replaces, the error, Annuler and the submit button. */
function FormFooter({
  replaces,
  error,
  pending,
  submit,
  closeHref,
}: {
  replaces: string | null;
  error: GoalFormState["error"];
  pending: boolean;
  submit: string;
  closeHref: string;
}) {
  const t = useTranslations("Logbook.goals.form");
  return (
    <>
      {replaces && (
        <p className="mt-4 rounded-box bg-accent-2/10 px-3 py-2 text-[13px]">
          {t("replaces", { title: replaces })}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[13px] text-danger">
          {t(`errors.${error}`)}
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Link href={closeHref} className={buttonClass("outline")}>
          {t("cancel")}
        </Link>
        <Button type="submit" disabled={pending}>
          {submit}
        </Button>
      </div>
    </>
  );
}

interface Props {
  /** The goal changed by « Modifier »; null for a new one. */
  editing: GoalView | null;
  practicesAllowed: boolean;
  models: readonly string[];
  /** Pilot Free: the running goal the new one replaces. */
  replaces: string | null;
  closeHref: string;
}

/** « Nouvel objectif » and « Modifier » (maquette v12, form over the page). */
export function GoalForm({ editing, practicesAllowed, models, replaces, closeHref }: Props) {
  const t = useTranslations("Logbook.goals.form");
  const goal = editing?.definition ?? DEFAULT;
  const [kind, setKind] = useState<GoalKind>(goal.kind);
  const [state, action, pending] = useActionState<GoalFormState, FormData>(
    saveGoalAction.bind(null, editing?.goalId ?? null),
    { error: null },
  );
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <form
        action={action}
        aria-label={editing ? t("editTitle") : t("title")}
        className="w-full max-w-3xl rounded-panel border border-line bg-surface p-5 shadow-xl"
      >
        <FormHeader title={editing ? t("editTitle") : t("title")} closeHref={closeHref} />
        <p className={STEP}>{t("what")}</p>
        <KindChoice kind={kind} onChange={setKind} practicesAllowed={practicesAllowed} />
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className={STEP}>{t("targetStep")}</p>
            <TargetFields key={kind} kind={kind} goal={goal} />
          </div>
          <div>
            <p className={STEP}>{t("aircraftStep")}</p>
            <AircraftField goal={goal} models={models} />
          </div>
        </div>
        <p className={`${STEP} mt-4`}>{t("whenStep")}</p>
        <WindowFields key={kind} goal={goal} kind={kind} />
        <FormFooter
          replaces={editing ? null : replaces}
          error={state.error}
          pending={pending}
          submit={editing ? t("save") : t("create")}
          closeHref={closeHref}
        />
      </form>
    </div>
  );
}
