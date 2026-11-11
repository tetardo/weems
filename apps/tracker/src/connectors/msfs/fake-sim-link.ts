import type { SimLink, SimLinkHandlers } from "./sim-link.ts";

/** Stands for SimConnect in tests: the test decides when the simulator runs and what it sends. */
export class FakeSimLink implements SimLink {
  simulatorRunning = false;
  handlers: SimLinkHandlers | null = null;
  rates: string[] = [];
  aircraftRequests = 0;

  async open(handlers: SimLinkHandlers) {
    if (!this.simulatorRunning) throw new Error("no simulator");
    this.handlers = handlers;
    return { simulator: "msfs2024" as const };
  }
  setSampleRate(rate: "high" | "normal") {
    this.rates.push(rate);
  }
  requestAircraft() {
    this.aircraftRequests += 1;
  }
  close() {
    this.handlers = null;
  }
  /** The simulator quits. */
  quit() {
    this.simulatorRunning = false;
    const handlers = this.handlers;
    this.handlers = null;
    handlers?.closed();
  }
  get sim(): SimLinkHandlers {
    if (!this.handlers) throw new Error("not connected");
    return this.handlers;
  }
}
