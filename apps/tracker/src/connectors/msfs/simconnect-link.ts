import {
  type ConnectionHandle,
  open,
  Protocol,
  SimConnectConstants,
  SimConnectDataType,
  SimConnectPeriod,
} from "node-simconnect";
import type { SimLink, SimLinkHandlers } from "./sim-link.ts";
import {
  AIRCRAFT_NUMBER_VARS,
  AIRCRAFT_STRING_VARS,
  decodeAircraft,
  decodeSample,
  sampleDefinition,
} from "./sim-vars.ts";
import { SYSTEM_EVENTS } from "./system-events.ts";

const SAMPLE_DEFINITION = 1;
const AIRCRAFT_DEFINITION = 2;
const SAMPLE_REQUEST = 1;
/** Each aircraft read uses a new request id (a ONCE request cannot be re-sent: fiche 01). */
const FIRST_AIRCRAFT_REQUEST = 100;
/** MSFS 2020 answers 11, MSFS 2024 answers 12 (to confirm on the PC: pieges.md). */
const MSFS_2024_MAJOR_VERSION = 12;

/**
 * The only code that talks to SimConnect (Windows). Declares the SimVars of sim-vars.ts,
 * subscribes to the system events and hands raw values to the connector.
 */
export class SimConnectLink implements SimLink {
  private handle: ConnectionHandle | null = null;
  private rate: "high" | "normal" = "normal";
  private aircraftRequest = FIRST_AIRCRAFT_REQUEST;

  async open(handlers: SimLinkHandlers) {
    const { recvOpen, handle } = await open("Weems Tracker", Protocol.KittyHawk);
    this.handle = handle;
    this.declare(handle);
    this.listen(handle, handlers);
    this.requestSamples();
    this.requestAircraft();
    const msfs2024 = recvOpen.applicationVersionMajor >= MSFS_2024_MAJOR_VERSION;
    return { simulator: msfs2024 ? ("msfs2024" as const) : ("msfs2020" as const) };
  }

  /** EF-09: every simulated frame near the ground, once per second elsewhere. */
  setSampleRate(rate: "high" | "normal"): void {
    this.rate = rate;
    this.requestSamples();
  }

  requestAircraft(): void {
    this.aircraftRequest += 1;
    this.handle?.requestDataOnSimObject(
      this.aircraftRequest,
      AIRCRAFT_DEFINITION,
      SimConnectConstants.OBJECT_ID_USER,
      SimConnectPeriod.ONCE,
    );
  }

  close(): void {
    this.handle?.close();
    this.handle = null;
  }

  private requestSamples(): void {
    this.handle?.requestDataOnSimObject(
      SAMPLE_REQUEST,
      SAMPLE_DEFINITION,
      SimConnectConstants.OBJECT_ID_USER,
      this.rate === "high" ? SimConnectPeriod.SIM_FRAME : SimConnectPeriod.SECOND,
    );
  }

  private declare(handle: ConnectionHandle): void {
    for (const { name, unit } of sampleDefinition()) {
      handle.addToDataDefinition(SAMPLE_DEFINITION, name, unit, SimConnectDataType.FLOAT64);
    }
    for (const [, name] of AIRCRAFT_STRING_VARS) {
      handle.addToDataDefinition(AIRCRAFT_DEFINITION, name, null, SimConnectDataType.STRING256);
    }
    for (const [, name, unit] of AIRCRAFT_NUMBER_VARS) {
      handle.addToDataDefinition(AIRCRAFT_DEFINITION, name, unit, SimConnectDataType.FLOAT64);
    }
    SYSTEM_EVENTS.forEach((name, i) => handle.subscribeToSystemEvent(i + 1, name));
  }

  private listen(handle: ConnectionHandle, handlers: SimLinkHandlers): void {
    handle.on("simObjectData", (recv) => {
      if (recv.defineID === SAMPLE_DEFINITION) {
        handlers.sample(decodeSample(() => recv.data.readFloat64()));
      } else if (recv.defineID === AIRCRAFT_DEFINITION) {
        handlers.aircraft(
          decodeAircraft(
            () => recv.data.readString256(),
            () => recv.data.readFloat64(),
          ),
        );
      }
    });
    const onEvent = (recv: { clientEventId: number; data: number }) => {
      const name = SYSTEM_EVENTS[recv.clientEventId - 1];
      if (name) handlers.systemEvent(name, recv.data);
    };
    handle.on("event", onEvent);
    handle.on("eventFilename", onEvent); // AircraftLoaded, FlightLoaded
    handle.on("exception", (recv) =>
      handlers.warning(`SimConnect: ${recv.exceptionName} (index ${recv.index})`),
    );
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      this.handle = null;
      handlers.closed();
    };
    handle.on("close", close);
    handle.on("error", close);
  }
}
