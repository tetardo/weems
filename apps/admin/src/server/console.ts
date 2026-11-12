import { consoleConfig } from "./console-config.ts";
import { LibraryChecker } from "./libraries/library-checker.ts";
import { ServicesManager } from "./services/services-manager.ts";
import { singleton } from "./singleton.ts";
import { ActivityRunner } from "./activity/activity-runner.ts";
import { TrafficRunner } from "./traffic/traffic-runner.ts";

/** The console's long-lived parts, one per process (see singleton.ts). */
export const config = () => singleton("config", () => consoleConfig());
export const services = () => singleton("services", () => new ServicesManager(config()));
/** Pages Trafic simulé and Activité simulée: one run at a time between the two. */
export const traffic = (): TrafficRunner =>
  singleton("traffic", () => new TrafficRunner(config(), () => activity().isBusy()));
export const activity = (): ActivityRunner =>
  singleton("activity", () => new ActivityRunner(config(), () => traffic().isBusy()));
/** Page Librairies: the last check of the repository's libraries. */
export const libraries = () => singleton("libraries", () => new LibraryChecker(config()));
