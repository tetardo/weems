"use client";

import type { AdminSupervision } from "@weems/contrats";
import { readSupervision } from "../../actions/supervision.ts";
import { useConsoleStatus } from "../../site/use-console-status.ts";
import { clock } from "../../format/time.ts";
import { ErrorBox } from "../../ui/error-box.tsx";
import { SupervisionIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { usePolling } from "../../ui/use-polling.ts";
import { ActivitySection } from "./activity-section.tsx";
import { CommunitySection } from "./community-section.tsx";
import { migrationsText } from "./figures.ts";
import { HealthSection } from "./health-section.tsx";
import { TrendTiles } from "./trend-tiles.tsx";

const NAMES = { db: "Base", api: "API", site: "Site" } as const;

/** « Base · API · Site · Migrations à jour · lu à 06:42 », each with its state. */
function Subtitle({ data }: { data: AdminSupervision | null }) {
  const { services } = useConsoleStatus();
  const migrations = data?.health.migrations;
  const late = migrations !== undefined && migrations.applied < migrations.expected;
  return (
    <span className="sv-status">
      {services.map((service) => (
        <span key={service.id}>
          <i className={service.state === "running" ? "dot" : "dot off"} />
          {NAMES[service.id]}
        </span>
      ))}
      {migrations && (
        <span className={late ? "sv-warn" : ""}>
          <i className={late ? "dot warn" : "dot"} />
          {migrationsText(migrations)}
          {late && <code>pnpm --filter @weems/api db:migrate</code>}
        </span>
      )}
      {data && <span className="muted">lu à {clock(data.generatedAt)}, toutes les 10 s</span>}
    </span>
  );
}

/** The page Supervision (spec admin): every figure of the site at a glance. */
export function SupervisionView({ siteUrl }: { siteUrl: string }) {
  const { value: data, error } = usePolling(readSupervision, 10_000);
  const nowMs = Date.now();
  return (
    <>
      <PageTitle
        icon={<SupervisionIcon />}
        title="Supervision"
        subtitle={<Subtitle data={data} />}
      />
      <ErrorBox message={error} />
      {!data && !error && <p className="muted">Lecture des chiffres…</p>}
      {data && (
        <div className="sv-page">
          <TrendTiles tiles={data.tiles} liveUrl={`${siteUrl}/fr/live`} />
          <HealthSection health={data.health} nowMs={nowMs} />
          <ActivitySection activity={data.activity} nowMs={nowMs} />
          <CommunitySection community={data.community} siteUrl={siteUrl} nowMs={nowMs} />
        </div>
      )}
    </>
  );
}
