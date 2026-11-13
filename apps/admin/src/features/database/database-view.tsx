"use client";

import type { DatabaseCleanupRequest } from "@weems/contrats";
import { useState } from "react";
import {
  backupDatabase,
  cleanDatabase,
  migrateDatabase,
  readDatabase,
} from "../../actions/database.ts";
import { clock } from "../../format/time.ts";
import type { DatabaseView as View } from "../../server/database/database-page.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { DatabaseIcon, RestartIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { BackupBand } from "./backup-band.tsx";
import { BackupsPanel } from "./backups-panel.tsx";
import { CleanupPanel } from "./cleanup-panel.tsx";
import { HistoryCharts } from "./history-charts.tsx";
import { growthOf } from "./history.ts";
import { MigrationsPanel } from "./migrations-panel.tsx";
import { backupWarning, cleanupResultText } from "./model.ts";
import { SummaryTiles } from "./summary-tiles.tsx";
import { TablesPanel } from "./tables-panel.tsx";

function Subtitle({ view }: { view: View | null }) {
  if (!view) return <span className="muted">Lecture de la base…</span>;
  return (
    <span className="sv-status">
      <span>
        <i className="dot" />
        Vérifié aujourd’hui à {clock(view.database.generatedAt)}
      </span>
      <span className="muted">toutes les 5 min</span>
      <span className="mono muted">
        {view.database.server.name} · {view.database.server.version}
      </span>
    </span>
  );
}

/** Buttons of the page: each runs one action, then reads the page again. */
function usePageActions(refresh: () => Promise<void>) {
  const runner = useActionRunner(refresh);
  const [result, setResult] = useState<string | null>(null);
  const clean = (choice: DatabaseCleanupRequest) =>
    runner.run(async () => {
      const done = await cleanDatabase(choice);
      setResult(done.ok ? cleanupResultText(done.value) : null);
      return done;
    });
  return {
    runner,
    result,
    clean,
    backup: () => void runner.run(backupDatabase),
    migrate: () => void runner.run(migrateDatabase),
  };
}

function Page({ view, actions }: { view: View; actions: ReturnType<typeof usePageActions> }) {
  const nowMs = Date.now();
  const busy = actions.runner.busy;
  const backingUp = busy || view.backingUp;
  return (
    <div className="sv-page">
      <SummaryTiles view={view} nowMs={nowMs} />
      <BackupBand
        warning={backupWarning(view.backups[0]?.createdAt ?? null, nowMs)}
        busy={backingUp}
        onBackup={actions.backup}
      />
      <HistoryCharts history={view.database.history} totalBytes={view.database.totalBytes} />
      <TablesPanel tables={view.database.tables} growth={growthOf(view.database.history)} />
      <div className="sv-grid3 db-pair">
        <MigrationsPanel
          migrations={view.database.migrations}
          busy={busy || view.migrating}
          onApply={actions.migrate}
        />
        <BackupsPanel backups={view.backups} busy={backingUp} onBackup={actions.backup} />
      </div>
      <CleanupPanel
        preview={view.database.cleanup}
        busy={busy}
        result={actions.result}
        onClean={actions.clean}
      />
    </div>
  );
}

/**
 * Sizes move slowly and the charts rest on one reading a day: every 5 min, plus the button, is
 * enough and spares PostgreSQL a scan of every table.
 */
const READ_EVERY_MS = 5 * 60_000;

/** Page Base de données (spec admin): sizes, migrations, backups and cleanup. */
export function DatabaseView() {
  const { value, error, refresh } = usePolling(readDatabase, READ_EVERY_MS);
  const actions = usePageActions(refresh);
  return (
    <>
      <PageTitle
        icon={<DatabaseIcon />}
        title="Base de données"
        subtitle={<Subtitle view={value} />}
        actions={
          <button className="btn" disabled={actions.runner.busy} onClick={() => void refresh()}>
            <RestartIcon size={16} />
            Actualiser
          </button>
        }
      />
      <ErrorBox message={error ?? actions.runner.error} />
      {value && <Page view={value} actions={actions} />}
    </>
  );
}
