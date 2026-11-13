"use server";

import { services } from "../server/console.ts";
import type { ApiMode, ServiceId } from "../server/services/service-view.ts";
import { attempt } from "./result.ts";

export async function readServices() {
  return attempt(() => services().view());
}

export async function serviceLogs(id: ServiceId) {
  return attempt(() => services().logs(id));
}

export async function controlService(id: ServiceId, action: "start" | "stop" | "restart") {
  return attempt(async () => {
    const manager = services();
    if (action === "start") await manager.start(id);
    else if (action === "stop") await manager.stop(id);
    else await manager.restart(id);
    return null;
  });
}

export async function controlAll(action: "start" | "stop") {
  return attempt(async () => {
    if (action === "start") await services().startAll();
    else await services().stopAll();
    return null;
  });
}

export async function freePortAndStart(id: "api" | "site") {
  return attempt(async () => {
    await services().freePortAndStart(id);
    return null;
  });
}

export async function chooseApiMode(mode: ApiMode) {
  return attempt(async () => {
    await services().setApiMode(mode);
    return null;
  });
}
