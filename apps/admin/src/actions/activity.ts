"use server";

import { activity } from "../server/console.ts";
import { ActivityLaunch } from "../server/activity/launch.ts";
import { attempt } from "./result.ts";

export async function readActivity() {
  return attempt(() => activity().view());
}

export async function startActivity(launch: unknown) {
  return attempt(async () => {
    activity().start(ActivityLaunch.parse(launch));
    return null;
  });
}

export async function stopActivity() {
  return attempt(async () => {
    await activity().stop();
    return null;
  });
}

export async function deleteFictitiousPopulation() {
  return attempt(async () => {
    await activity().deleteAll();
    return null;
  });
}
