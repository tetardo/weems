"use client";

import { useState } from "react";
import { serviceLogs } from "../../actions/services.ts";
import type { ServiceId } from "../../server/services/service-view.ts";
import { CopyIcon, LiveIcon } from "../../ui/icons.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { formatLogs } from "./log-format.ts";

const TABS: { id: ServiceId; label: string }[] = [
  { id: "api", label: "API" },
  { id: "db", label: "Base" },
  { id: "site", label: "Site" },
];

/** The last 200 lines of a service, read every 2 s while « En direct » is on. */
export function LogsPanel({ tab, onTab }: { tab: ServiceId; onTab: (id: ServiceId) => void }) {
  const [live, setLive] = useState(true);
  const { value: lines } = usePolling(() => serviceLogs(tab), live ? 2_000 : 3_600_000);
  const shown = formatLogs(lines ?? []);
  return (
    <section className="panel logs">
      <div className="bar">
        <h2>Journaux</h2>
        <div className="tabs">
          {TABS.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "on" : ""}
              onClick={() => onTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <span className="muted hide">200 dernières lignes</span>
        <button className={`chip sp ${live ? "on" : ""}`} onClick={() => setLive(!live)}>
          <LiveIcon size={15} /> En direct
        </button>
        <button
          className="iconbtn"
          aria-label="Copier les journaux"
          onClick={() => void navigator.clipboard.writeText(shown.join("\n"))}
        >
          <CopyIcon size={16} />
        </button>
      </div>
      <pre className="term">
        {shown.length > 0 ? shown.join("\n") : "Aucune ligne pour l'instant."}
      </pre>
    </section>
  );
}
