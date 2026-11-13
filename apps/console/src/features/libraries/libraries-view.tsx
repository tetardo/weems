"use client";

import { checkLibraries, readLibraries } from "../../actions/libraries.ts";
import { clock, dayAndClock } from "../../format/time.ts";
import type { LibraryReport } from "../../server/libraries/report.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { LibrariesIcon, RestartIcon, VisitorsIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { LibrariesTable } from "./libraries-table.tsx";
import { SecurityBand } from "./security-band.tsx";
import { SummaryTiles } from "./summary-tiles.tsx";

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/** « Lecture seule… » then « Vérifié aujourd'hui à 07:38 », or the check in progress. */
function Subtitle({ report, checking }: { report: LibraryReport | null; checking: boolean }) {
  const when = report
    ? isToday(report.checkedAt)
      ? `aujourd’hui à ${clock(report.checkedAt)}`
      : `le ${dayAndClock(report.checkedAt)}`
    : null;
  return (
    <span className="lib-sub">
      <span>
        <VisitorsIcon size={14} />
        Lecture seule : la page vérifie et renvoie vers la page officielle, elle n’installe rien.
      </span>
      <span className="muted">
        {checking ? "Vérification en cours…" : when ? `Vérifié ${when}` : "Jamais vérifié"} ·
        registre npm et alertes de pnpm audit
      </span>
    </span>
  );
}

function Report({ report }: { report: LibraryReport }) {
  return (
    <div className="lib-page">
      <SummaryTiles report={report} />
      <SecurityBand alerts={report.alerts} auditError={report.auditError} />
      <LibrariesTable rows={report.libraries} />
    </div>
  );
}

function CheckButton(props: { checking: boolean; busy: boolean; onCheck: () => void }) {
  return (
    <button className="btn" disabled={props.checking || props.busy} onClick={props.onCheck}>
      <RestartIcon size={16} />
      {props.checking ? "Vérification…" : "Vérifier maintenant"}
    </button>
  );
}

/** Page Librairies (console spec): versions of the libraries the repository uses, read-only. */
export function LibrariesView() {
  const { value, error, refresh } = usePolling(readLibraries, 3_000);
  const runner = useActionRunner(refresh);
  const { checking, report } = value ?? { checking: false, report: null };
  return (
    <>
      <PageTitle
        icon={<LibrariesIcon />}
        title="Librairies"
        subtitle={<Subtitle report={report} checking={checking} />}
        actions={
          <CheckButton
            checking={checking}
            busy={runner.busy}
            onCheck={() => void runner.run(checkLibraries)}
          />
        }
      />
      <ErrorBox message={error ?? runner.error ?? value?.error ?? null} />
      {report ? (
        <Report report={report} />
      ) : (
        !error && <p className="muted">Première vérification, quelques secondes…</p>
      )}
    </>
  );
}
