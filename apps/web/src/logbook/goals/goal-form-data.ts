import { GoalDefinition, type GoalAircraft } from "@weems/contrats";

/** "category:turboprop" or "model:A20N" in the form; "" for every aircraft. */
function aircraftOfField(field: string): GoalAircraft | null {
  const [by, value] = field.split(":");
  if (!value) return null;
  return by === "category" ? ({ category: value } as GoalAircraft) : { model: value };
}

export const fieldOfAircraft = (aircraft: GoalAircraft | null) =>
  aircraft === null
    ? ""
    : "category" in aircraft
      ? `category:${aircraft.category}`
      : `model:${aircraft.model}`;

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

/** The goal written in the form « Nouvel objectif »; null when the API would refuse it. */
export function definitionOf(form: FormData): GoalDefinition | null {
  const kind = text(form, "kind");
  const window = text(form, "window");
  const parsed = GoalDefinition.safeParse({
    kind,
    target: Number(text(form, "target").replace(",", ".")),
    threshold: kind === "softLandings" ? Number(text(form, "threshold")) : null,
    practice: kind === "goodPractices" ? text(form, "practice") : null,
    aircraft: aircraftOfField(text(form, "aircraft")),
    window,
    until: window === "date" ? text(form, "until") : null,
    recurring: (window === "week" || window === "month") && form.get("recurring") === "on",
  });
  return parsed.success ? parsed.data : null;
}
