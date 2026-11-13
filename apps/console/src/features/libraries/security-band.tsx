import type { SecurityAlert } from "../../server/libraries/report.ts";
import { ExternalIcon, SecurityIcon } from "../../ui/icons.ts";
import { severityLabel } from "./severity.ts";
import { type AlertGroup, alertGroups, fixedIn } from "./table-model.ts";

function AlertCard({ group }: { group: AlertGroup }) {
  const [first] = group.alerts;
  if (!first) return null;
  return (
    <div className="lib-alert-card">
      <div className="lib-alert-head">
        <b className="mono">{group.library}</b>
        <span className={`lib-sev ${group.severity}`}>
          {severityLabel(group.severity, group.alerts.length)}
        </span>
        <span className="muted">{group.direct ? "directe" : "indirecte"}</span>
      </div>
      <ul>
        {group.alerts.map((alert) => (
          <li key={alert.url || alert.title}>
            {alert.url ? (
              <a href={alert.url} target="_blank" rel="noreferrer">
                {alert.title} <ExternalIcon size={12} />
              </a>
            ) : (
              alert.title
            )}
          </li>
        ))}
      </ul>
      <span className="mono muted">
        {group.direct
          ? `${first.paths[0]} · ${first.installed.join(", ")} → ${fixedIn(group.alerts)}`
          : `via ${first.paths[0]} · corrigé en ${fixedIn(group.alerts)}`}
      </span>
    </div>
  );
}

/** « À corriger en priorité »: one card per vulnerable library; nothing when the audit is clean. */
export function SecurityBand(props: { alerts: SecurityAlert[]; auditError: string | null }) {
  if (props.auditError)
    return (
      <div className="sv-alert" role="status">
        <SecurityIcon size={16} />
        <b>Alertes de sécurité non vérifiées</b>
        <span>{props.auditError}</span>
      </div>
    );
  if (props.alerts.length === 0) return null;
  return (
    <section className="lib-security" aria-label="Alertes de sécurité">
      <h2>
        <SecurityIcon size={18} /> À corriger en priorité
      </h2>
      <div className="lib-alert-grid">
        {alertGroups(props.alerts).map((group) => (
          <AlertCard key={group.library} group={group} />
        ))}
      </div>
    </section>
  );
}
