"use client";

import { ago } from "../../format/time.ts";
import type { ApiMode, ServiceView } from "../../server/services/service-view.ts";
import {
  ApiIcon,
  DatabaseIcon,
  InfoIcon,
  LogsIcon,
  RestartIcon,
  SiteIcon,
  StartIcon,
  StopIcon,
} from "../../ui/icons.ts";
import { StatusBadge, type Tone } from "../../ui/status-badge.tsx";

export type ServiceAction = "start" | "stop" | "restart";

const CARDS = {
  db: { name: "Base de données", sub: "PostgreSQL 16 · Docker", icon: <DatabaseIcon size={20} /> },
  api: { name: "API", sub: "Fastify", icon: <ApiIcon size={20} /> },
  site: { name: "Site web", sub: "Next.js · pnpm dev", icon: <SiteIcon size={20} /> },
} as const;

const STATES: Record<ServiceView["state"], { tone: Tone; label: string }> = {
  running: { tone: "ok", label: "En marche" },
  starting: { tone: "warn", label: "Démarrage…" },
  stopped: { tone: "off", label: "Arrêté" },
  error: { tone: "err", label: "En erreur" },
};

function runnerText(service: ServiceView): string {
  if (service.runner === "console") return `pnpm dev · PID ${service.pid ?? "?"}`;
  if (service.runner === "docker") return service.container ?? "Docker";
  if (service.runner === "outside") return "lancé hors console";
  return "—";
}

function Details({ service }: { service: ServiceView }) {
  const health =
    service.health.ms === null
      ? service.health.detail
      : `${service.health.detail} · ${service.health.ms} ms`;
  return (
    <dl className="kv">
      <dt>{service.id === "db" ? "Conteneur" : "Processus"}</dt>
      <dd>{runnerText(service)}</dd>
      <dt>Port</dt>
      <dd>{service.port}</dd>
      <dt>Santé</dt>
      <dd>{service.state === "stopped" ? "—" : health}</dd>
      {service.since && (
        <>
          <dt>Depuis</dt>
          <dd>{ago(service.since, Date.now()).replace("il y a ", "")}</dd>
        </>
      )}
    </dl>
  );
}

function ApiModeSwitch(props: {
  mode: ApiMode;
  disabled: boolean;
  onMode: (mode: ApiMode) => void;
}) {
  return (
    <div className="mode2" role="group" aria-label="Mode de l'API">
      {(["dev", "docker"] as const).map((mode) => (
        <button
          key={mode}
          className={props.mode === mode ? "on" : ""}
          disabled={props.disabled}
          onClick={() => props.onMode(mode)}
        >
          {mode === "dev" ? "Développement" : "Docker"}
        </button>
      ))}
    </div>
  );
}

function Buttons(props: {
  service: ServiceView;
  busy: boolean;
  onAction: (a: ServiceAction) => void;
  onLogs: () => void;
}) {
  const { service, busy } = props;
  const up = service.state === "running" || service.state === "starting";
  const ours = service.runner === "console" || service.runner === "docker";
  return (
    <div className="row">
      {!up && (
        <button className="btn sm" disabled={busy} onClick={() => props.onAction("start")}>
          <StartIcon size={15} /> Démarrer
        </button>
      )}
      {up && ours && (
        <>
          <button
            className="btn sm ghost"
            disabled={busy}
            onClick={() => props.onAction("restart")}
          >
            <RestartIcon size={15} /> Redémarrer
          </button>
          <button className="btn sm ghost" disabled={busy} onClick={() => props.onAction("stop")}>
            <StopIcon size={15} /> Arrêter
          </button>
        </>
      )}
      <button className="btn sm ghost" onClick={props.onLogs}>
        <LogsIcon size={15} /> Journaux
      </button>
    </div>
  );
}

export function ServiceCard(props: {
  service: ServiceView;
  apiMode: ApiMode;
  busy: boolean;
  onAction: (action: ServiceAction) => void;
  onMode: (mode: ApiMode) => void;
  onLogs: () => void;
}) {
  const { service } = props;
  const card = CARDS[service.id];
  const state = STATES[service.state];
  const sub =
    service.id === "api"
      ? `${card.sub} · ${props.apiMode === "dev" ? "pnpm dev" : "Docker"}`
      : card.sub;
  return (
    <section className={`panel svc ${service.state === "stopped" ? "stopped" : ""}`}>
      <div className="hd">
        <div className="ic">{card.icon}</div>
        <div>
          <h3>{card.name}</h3>
          <div className="sub">{sub}</div>
        </div>
        <StatusBadge tone={state.tone} dot>
          {state.label}
        </StatusBadge>
      </div>
      {service.id === "api" && (
        <ApiModeSwitch mode={props.apiMode} disabled={props.busy} onMode={props.onMode} />
      )}
      <Details service={service} />
      {service.error && <div className="errbox">{service.error}</div>}
      {service.runner === "outside" && (
        <div className="note">
          <InfoIcon size={14} /> Lancé hors de la console : arrêtez-le dans son terminal.
        </div>
      )}
      <Buttons
        service={service}
        busy={props.busy}
        onAction={props.onAction}
        onLogs={props.onLogs}
      />
    </section>
  );
}
