"use server";

import { traffic } from "../server/console.ts";
import { Launch } from "../server/traffic/launch.ts";
import { attempt } from "./result.ts";

export async function readTraffic() {
  return attempt(() => traffic().view());
}

export async function startTraffic(launch: unknown) {
  return attempt(async () => {
    traffic().start(Launch.parse(launch));
    return null;
  });
}

export async function stopTraffic() {
  return attempt(async () => {
    await traffic().stop();
    return null;
  });
}

export async function deleteSimulatedFlights() {
  return attempt(async () => {
    await traffic().deleteSimulated();
    return null;
  });
}
