"use client";

import { useState } from "react";
import {
  chooseApiMode,
  controlAll,
  controlService,
  freePortAndStart,
  readServices,
} from "../../actions/services.ts";
import type {
  ServiceId,
  ServicesView as Services,
  ServiceView,
} from "../../server/services/service-view.ts";
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

function FreeDialog(props: {
  service: ServiceView;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (id: "api" | "site") => void;
}) {
  const id = props.service.id === "api" ? "api" : "site";
  return (
    <ConfirmDialog
      title="Arrêter l'ancien lancement ?"
      confirmLabel="Arrêter et démarrer"
      busy={props.busy}
      onCancel={props.onCancel}
      onConfirm={() => props.onConfirm(id)}
    >
      <p className="muted">
        La console arrête {props.service.holder?.owner ?? "le programme"}, un ancien lancement de
        Weems, puis démarre le service à sa place.
      </p>
    </ConfirmDialog>
  );
}

type Run = ReturnType<typeof useActionRunner>["run"];

function Cards(props: {
  value: Services;
  busy: boolean;
  run: Run;
  onStopDb: () => void;
  onLogs: (id: ServiceId) => void;
  onFree: (service: ServiceView) => void;
}) {
  const { value, busy, run } = props;
  return (
    <div className="grid3">
      {value.services.map((service) => (
        <ServiceCard
          key={service.id}
          service={service}
          apiMode={value.apiMode}
          busy={busy}
          onAction={(action) =>
            service.id === "db" && action === "stop"
              ? props.onStopDb()
              : void run(() => controlService(service.id, action))
          }
          onMode={(mode) => void run(() => chooseApiMode(mode))}
          onLogs={() => props.onLogs(service.id)}
          onFree={() => props.onFree(service)}
        />
      ))}
    </div>
  );
}

/** Page Services (console spec): three cards, the logs, start and stop everything. */
export function ServicesView() {
  const { value, error, refresh } = usePolling(readServices, 5_000);
  const { busy, error: actionError, run } = useActionRunner(refresh);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [logsTab, setLogsTab] = useState<ServiceId>("api");
  const [freeing, setFreeing] = useState<ServiceView | null>(null);
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
      {value && (
        <Cards
          value={value}
          busy={busy}
          run={run}
          onStopDb={() => setConfirm("db")}
          onLogs={setLogsTab}
          onFree={setFreeing}
        />
      )}
      <LogsPanel key={logsTab} tab={logsTab} onTab={setLogsTab} />
      {freeing && (
        <FreeDialog
          service={freeing}
          busy={busy}
          onCancel={() => setFreeing(null)}
          onConfirm={(id) => void run(() => freePortAndStart(id)).then(() => setFreeing(null))}
        />
      )}
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
