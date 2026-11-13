"use client";

import {
  deleteSimulatedFlights,
  readTraffic,
  startTraffic,
  stopTraffic,
} from "../../actions/traffic.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { TrafficIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { HistoryPanel } from "./history-panel.tsx";
import { LaunchForms } from "./launch-forms.tsx";
import { RunPanel } from "./run-panel.tsx";
import { SimulatedFlightsPanel } from "./simulated-flights-panel.tsx";

function Title({ apiUrl, siteUrl }: { apiUrl: string; siteUrl: string }) {
  return (
    <PageTitle
      icon={<TrafficIcon />}
      title="Trafic simulé"
      subtitle={
        <>
          Vols simulés envoyés à l&apos;API locale{" "}
          <span className="mono">{new URL(apiUrl).host}</span>, visibles sur la carte en direct
        </>
      }
      actions={
        <a className="btn ghost" href={`${siteUrl}/fr/live`} target="_blank" rel="noreferrer">
          <TrafficIcon size={16} /> Ouvrir la carte en direct
        </a>
      }
    />
  );
}

/** Page Trafic simulé (console spec): one run at a time, its follow-up, history, clean-up. */
export function TrafficView({ apiUrl, siteUrl }: { apiUrl: string; siteUrl: string }) {
  const { value, error, refresh } = usePolling(readTraffic, 2_000);
  const { busy, error: actionError, run } = useActionRunner(refresh);
  const current = value ? value.run : null;
  const active = current !== null && current.state !== "ended";
  return (
    <>
      <Title apiUrl={apiUrl} siteUrl={siteUrl} />
      <ErrorBox message={actionError ?? error} />
      {current && value && (
        <RunPanel
          run={current}
          series={value.series}
          busy={busy}
          onStop={() => void run(stopTraffic)}
        />
      )}
      <LaunchForms
        disabled={active || busy}
        onLaunch={(launch) => void run(() => startTraffic(launch))}
      />
      <div className="split">
        <HistoryPanel history={value ? value.history : []} />
        <SimulatedFlightsPanel
          counts={value ? value.counts : null}
          disabled={active}
          busy={busy}
          onDelete={() => run(deleteSimulatedFlights).then(() => undefined)}
        />
      </div>
    </>
  );
}
