"use client";

import { useState } from "react";
import { chooseApiMode, controlAll, controlService, readServices } from "../../actions/services.ts";
import type { ServiceId, ServicesView as Services } from "../../server/services/service-view.ts";
import { ConfirmDialog } from "../../ui/confirm-dialog.tsx";
import { ErrorBox } from "../../ui/error-box.tsx";
import { ServicesIcon, StartIcon, StopIcon } from "../../ui/icons.ts";
import { PageTitle } from "../../ui/page-title.tsx";
import { useActionRunner } from "../../ui/use-action-runner.ts";
import { usePolling } from "../../ui/use-polling.ts";
import { LogsPanel } from "./logs-panel.tsx";
import { ServiceCard } from "./service-card.tsx";

type Confirm = "all" | "db" | null;

function Title(props: {
  value: Services | null;
  busy: boolean;
  onStopAll: () => void;
  onStartAll: () => void;
}) {
  const running = props.value?.services.filter((s) => s.state === "running").length ?? 0;
  return (
    <PageTitle
      icon={<ServicesIcon />}
      title="Services"
      subtitle={
        <>
          Projet <span className="mono">weems</span> · <b>{running} sur 3</b> en marche · rafraîchi
          toutes les 5 s
        </>
      }
      actions={
        <>
          <button className="btn ghost" disabled={props.busy} onClick={props.onStopAll}>
            <StopIcon size={16} /> Tout arrêter
          </button>
          <button className="btn" disabled={props.busy} onClick={props.onStartAll}>
            <StartIcon size={16} /> Tout démarrer
          </button>
        </>
      }
    />
  );
}

function DockerBanner() {
  return (
    <div className="banner warn">
      <div>
        <b>Docker ne répond pas</b>
        <span>Lancez Docker Desktop : la base de données tourne dans Docker.</span>
      </div>
    </div>
  );
}

function StopDialog(props: {
  what: "all" | "db";
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmDialog
      title={props.what === "all" ? "Tout arrêter ?" : "Arrêter la base de données ?"}
      confirmLabel="Arrêter"
      busy={props.busy}
      onCancel={props.onCancel}
      onConfirm={props.onConfirm}
    >
      <p className="muted">
        L&apos;API et une simulation en cours ne pourront plus écrire. Les données restent dans le
        volume Docker. Les services lancés hors de la console ne sont pas touchés.
      </p>
    </ConfirmDialog>
  );
}

/** Page Services (spec admin): three cards, the logs, start and stop everything. */
export function ServicesView() {
  const { value, error, refresh } = usePolling(readServices, 5_000);
  const { busy, error: actionError, run } = useActionRunner(refresh);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [logsTab, setLogsTab] = useState<ServiceId>("api");
  const stop = (what: "all" | "db") =>
    void run(() => (what === "all" ? controlAll("stop") : controlService("db", "stop"))).then(() =>
      setConfirm(null),
    );
  return (
    <>
      <Title
        value={value}
        busy={busy}
        onStopAll={() => setConfirm("all")}
        onStartAll={() => void run(() => controlAll("start"))}
      />
      {value && !value.dockerAvailable && <DockerBanner />}
      <ErrorBox message={actionError ?? error} />
      <div className="grid3">
        {value?.services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            apiMode={value.apiMode}
            busy={busy}
            onAction={(action) =>
              service.id === "db" && action === "stop"
                ? setConfirm("db")
                : void run(() => controlService(service.id, action))
            }
            onMode={(mode) => void run(() => chooseApiMode(mode))}
            onLogs={() => setLogsTab(service.id)}
          />
        ))}
      </div>
      <LogsPanel key={logsTab} tab={logsTab} onTab={setLogsTab} />
      {confirm && (
        <StopDialog
          what={confirm}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() => stop(confirm)}
        />
      )}
    </>
  );
}
