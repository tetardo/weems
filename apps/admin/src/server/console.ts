import { consoleConfig } from "./console-config.ts";
import { ServicesManager } from "./services/services-manager.ts";
import { singleton } from "./singleton.ts";
import { TrafficRunner } from "./traffic/traffic-runner.ts";

/** The console's long-lived parts, one per process (see singleton.ts). */
export const config = () => singleton("config", () => consoleConfig());
export const services = () => singleton("services", () => new ServicesManager(config()));
export const traffic = () => singleton("traffic", () => new TrafficRunner(config()));
