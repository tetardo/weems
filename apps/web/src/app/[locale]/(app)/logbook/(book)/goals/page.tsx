import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getLogbookEntries } from "../../../../../../api/logbook-api.ts";
import { getGoals } from "../../../../../../api/goals-api.ts";
import { GoalsPage } from "../../../../../../logbook/goals/goals-page.tsx";
import { apiFallback } from "../../../../../../site/api-fallback.tsx";
import { pageTitle } from "../../../../../../site/page-title.ts";

export const generateMetadata = pageTitle("Logbook.goals");

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);

/** Page Objectifs of the private logbook (spec carnet privé, § 6). */
export default async function LogbookGoalsPage({ params, searchParams }: Props) {
  setRequestLocale((await params).locale);
  const query = await searchParams;
  try {
    const [goals, entries] = await Promise.all([getGoals(), getLogbookEntries()]);
    if (!goals) notFound();
    const models = [
      ...new Set(
        (entries?.entries ?? []).flatMap((e) =>
          e.flight.aircraftModel ? [e.flight.aircraftModel] : [],
        ),
      ),
    ].sort();
    const form = one(query["new"]) ? "new" : one(query["edit"]) ? "edit" : null;
    return (
      <GoalsPage
        goals={goals}
        selectedId={one(query["g"])}
        form={form}
        models={models}
        now={new Date()}
      />
    );
  } catch (error) {
    return apiFallback(error);
  }
}
