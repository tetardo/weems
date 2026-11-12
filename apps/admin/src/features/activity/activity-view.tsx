"use client";

import {
  deleteFictitiousPopulation,
  readActivity,
  startActivity,
  stopActivity,
} from "../../actions/activity.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { ActivityIcon, MapIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { FillsPanel } from "./fills-panel.tsx";
import { LiveForm } from "./live-form.tsx";
import { PopulationBand } from "./population-band.tsx";
import { PopulationForm } from "./population-form.tsx";
import { pageStateOf } from "./page-state.ts";
import { ActivityRunPanel } from "./run-panel.tsx";

function Title({ siteUrl }: { siteUrl: string }) {
  return (
    <PageTitle
      icon={<ActivityIcon />}
      title="Activité simulée"
      subtitle="Remplir tout le site : comptes fictifs, leurs vols passés, des vols en direct et des visiteurs sur la carte. Tout est marqué « fictif » et se supprime d'un coup."
      actions={
        <a className="btn ghost" href={`${siteUrl}/fr/live`} target="_blank" rel="noreferrer">
          <MapIcon size={16} /> Ouvrir la carte en direct
        </a>
      }
    />
  );
}

/** Page Activité simulée (spec admin): the fictitious population, then the live activity. */
export function ActivityView({ siteUrl }: { apiUrl: string; siteUrl: string }) {
  const { value, error, refresh } = usePolling(readActivity, 2_000);
  const { busy, error: actionError, run } = useActionRunner(refresh);
  const current = value?.run ?? null;
  const state = pageStateOf(value, busy);
  return (
    <>
      <Title siteUrl={siteUrl} />
      <ErrorBox message={actionError ?? error} />
      {current && (
        <ActivityRunPanel run={current} busy={busy} onStop={() => void run(stopActivity)} />
      )}
      <PopulationBand
        population={value?.population ?? null}
        disabled={state.active}
        busy={busy}
        onDelete={() => run(deleteFictitiousPopulation).then(() => undefined)}
      />
      <div className="modes">
        <PopulationForm
          disabled={state.populationOff}
          note={state.populationNote}
          existing={state.accounts}
          onLaunch={(launch) => void run(() => startActivity(launch))}
        />
        <LiveForm
          disabled={state.liveOff}
          note={state.liveNote}
          onLaunch={(launch) => void run(() => startActivity(launch))}
        />
      </div>
      <FillsPanel siteUrl={siteUrl} sampleHandle={state.sampleHandle} />
    </>
  );
}
