import type { SupervisionHealth } from "@weems/contrats";
import { ago, clock } from "../../format/time.ts";
import { DatabaseIcon, LatencyIcon, PositionsIcon, VersionsIcon } from "../../ui/icons.ts";
import { Bars } from "./bars.tsx";
import { SLOW_P95_MS, apiSummary, bytes, newestVersion, shares } from "./figures.ts";
import { Block } from "./section.tsx";

const ms = (value: number | null) => (value === null ? "—" : `${Math.round(value)} ms`);

function ApiBlock({ health }: { health: SupervisionHealth }) {
  const summary = apiSummary(health.apiHours);
  return (
    <Block icon={<LatencyIcon size={17} />} title="API · 24 h">
      <div className="sv-figures">
        <span>
          <b className="mono">{ms(summary.lastP95Ms)}</b>{" "}
          <span className="muted">p95 cette heure</span>
        </span>
        <span className={summary.serverErrors > 0 ? "sv-warn" : "muted"}>
          <b className="mono">{summary.serverErrors}</b> erreur{summary.serverErrors > 1 ? "s" : ""}{" "}
          5xx
        </span>
      </div>
      <Bars
        values={health.apiHours.map((hour) => hour.p95Ms ?? 0)}
        warn={health.apiHours.map((hour) => (hour.p95Ms ?? 0) >= SLOW_P95_MS)}
        label="Temps de réponse p95 par heure, sur 24 heures"
        tall
      />
      <div className="sv-axis">
        <span>-24 h</span>
        <span>pire heure : {ms(summary.worstP95Ms)}</span>
        <span>maintenant</span>
      </div>
    </Block>
  );
}

function PositionsBlock({ health, nowMs }: { health: SupervisionHealth; nowMs: number }) {
  const perMinute = health.positionsPerMinute;
  return (
    <Block icon={<PositionsIcon size={17} />} title="Positions reçues">
      <div className="sv-figures">
        <span>
          <b className="mono">{perMinute.at(-2) ?? 0}</b>{" "}
          <span className="muted">la minute passée</span>
        </span>
        <span className="muted">
          {health.lastPositionAt ? `dernière ${ago(health.lastPositionAt, nowMs)}` : "aucune"}
        </span>
      </div>
      <Bars values={perMinute} label="Positions reçues par minute, sur 30 minutes" tall />
      <div className="sv-axis">
        <span>-30 min</span>
        <span>mesuré depuis {clock(health.measuredSince)}</span>
        <span>maintenant</span>
      </div>
    </Block>
  );
}

function VersionsBlock({ versions }: { versions: SupervisionHealth["trackerVersions"] }) {
  const percents = shares(versions.map((version) => version.flights));
  const newest = newestVersion(versions.map((version) => version.version));
  return (
    <Block
      icon={<VersionsIcon size={17} />}
      title="Versions du tracker"
      hint="vols des 30 derniers jours"
    >
      {versions.length === 0 && <p className="muted">Aucun vol réel ces 30 derniers jours.</p>}
      {versions.map((version, i) => (
        <div className="sv-share" key={version.version}>
          <span className="mono">{version.version}</span>
          <span className="sv-gauge">
            <i
              className={version.version === newest ? "" : "warn"}
              style={{ width: `${percents[i]}%` }}
            />
          </span>
          <span className="mono muted">{percents[i]} %</span>
        </div>
      ))}
    </Block>
  );
}

function DatabaseBlock({ database }: { database: SupervisionHealth["database"] }) {
  return (
    <Block icon={<DatabaseIcon size={17} />} title="Base de données">
      <b className="sv-big">{bytes(database.bytes)}</b>
      {database.largestTables.map((table) => (
        <div className="sv-row" key={table.name}>
          <span className="mono">{table.name}</span>
          <span className="mono muted">{bytes(table.bytes)}</span>
        </div>
      ))}
    </Block>
  );
}

/** « Surveillance »: what tells a breakdown before a pilot reports it. */
export function HealthSection({ health, nowMs }: { health: SupervisionHealth; nowMs: number }) {
  return (
    <section className="sv-section">
      <h2>Surveillance</h2>
      <div className="sv-grid4">
        <ApiBlock health={health} />
        <PositionsBlock health={health} nowMs={nowMs} />
        <VersionsBlock versions={health.trackerVersions} />
        <DatabaseBlock database={health.database} />
      </div>
    </section>
  );
}
