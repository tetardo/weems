import type { ReactNode } from "react";
import type { LibraryReport } from "../../server/libraries/report.ts";
import { summaryOf } from "./table-model.ts";

function Tile(props: { label: string; value: number; tone?: string; detail: ReactNode }) {
  return (
    <div className={`sv-tile ${props.tone === "danger" ? "lib-tile-alert" : ""}`}>
      <span className="sv-label">{props.label}</span>
      <b className={`sv-big ${props.tone ? `lib-${props.tone}` : ""}`}>{props.value}</b>
      <span className="sv-detail">{props.detail}</span>
    </div>
  );
}

/** Four counters: libraries, up to date, updates by size, security alerts. */
export function SummaryTiles({ report }: { report: LibraryReport }) {
  const figures = summaryOf(report);
  const updates = figures.major + figures.minor + figures.patch;
  const share = figures.libraries ? Math.round((figures.current / figures.libraries) * 100) : 0;
  return (
    <div className="sv-tiles">
      <Tile
        label="Librairies directes"
        value={figures.libraries}
        detail={`dans ${report.packages} paquets du dépôt`}
      />
      <Tile
        label="À jour"
        value={figures.current}
        tone="success"
        detail={`${share} % des librairies directes`}
      />
      <Tile
        label="Mises à jour disponibles"
        value={updates}
        detail={
          <span className="lib-gaps">
            <span className="lib-gap major">{figures.major} majeures</span>
            <span className="lib-gap minor">{figures.minor} mineures</span>
            <span className="lib-gap patch">{figures.patch} correctifs</span>
          </span>
        }
      />
      <Tile
        label="Alertes de sécurité"
        value={figures.alerts}
        tone={figures.alerts ? "danger" : "success"}
        detail={
          report.auditError
            ? "audit impossible, voir plus bas"
            : `${figures.high} élevées · ${figures.moderate} modérées · ${figures.critical} critique`
        }
      />
    </div>
  );
}
