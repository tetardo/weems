import type { GoalSuggestion } from "@weems/contrats";
import { buttonClass } from "@weems/ui";
import { useTranslations } from "next-intl";
import { ProIcon } from "../../ui/icons.ts";
import { LockedCard } from "../locked-card.tsx";
import { LogbookCard } from "../logbook-card.tsx";
import { addSuggestionAction } from "./goal-actions.ts";
import { useGoalText } from "./goal-text.ts";

/** One suggestion: the goal, the figure it starts from, « Ajouter ». */
function SuggestionRow({ suggestion, now }: { suggestion: GoalSuggestion; now: string }) {
  const t = useTranslations("Logbook.goals.suggestions");
  const text = useGoalText();
  const { kind } = suggestion.definition;
  const basis = text.value(kind === "hours" ? "hours" : "flights", suggestion.basis);
  return (
    <li className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="font-semibold">
          {text.title({ definition: suggestion.definition, from: now })}
        </div>
        <div className="text-[12.5px] text-muted">{t(`basis.${kind}`, { value: basis })}</div>
      </div>
      <form action={addSuggestionAction.bind(null, JSON.stringify(suggestion.definition))}>
        <button type="submit" className={`${buttonClass("outline")} min-h-9 px-3 text-[13px]`}>
          + {t("add")}
        </button>
      </form>
    </li>
  );
}

/** « Suggérés d'après vos vols » (Pilot Pro, key goalSuggestions); locked without it. */
export function SuggestionsCard({
  suggestions,
  now,
}: {
  suggestions: readonly GoalSuggestion[] | null;
  now: string;
}) {
  const t = useTranslations("Logbook.goals.suggestions");
  if (suggestions === null) return <LockedCard title={t("title")} text={t("locked")} />;
  return (
    <LogbookCard icon={ProIcon} title={t("title")} className="h-full">
      {suggestions.length === 0 ? (
        <p className="m-0 text-[13px] text-muted">{t("none")}</p>
      ) : (
        <ul className="m-0 grid list-none gap-0 p-0">
          {suggestions.map((suggestion) => (
            <SuggestionRow key={suggestion.definition.kind} suggestion={suggestion} now={now} />
          ))}
        </ul>
      )}
    </LogbookCard>
  );
}
