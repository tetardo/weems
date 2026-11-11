import { describe, expect, it } from "vitest";
import { FLIGHT_PHASES } from "../flight/phase.ts";
import {
  CloseFlightRequest,
  FlightEventsRequest,
  FlightView,
  OpenFlightRequest,
  PositionReport,
} from "./flights.ts";

const FLIGHT_ID_V7 = "019a71b2-3c4d-7e5f-8a9b-0c1d2e3f4a5b";
const FLIGHT_ID_V4 = "3b241101-e2bb-4255-8caf-4136c566a962";

const openFlight = () => ({
  flightId: FLIGHT_ID_V7,
  callsign: "WMS123",
  aircraft: {
    simulator: "msfs2024",
    title: "FlyByWire A320neo",
    model: "A20N",
    registration: null,
    engineCount: 2,
    emptyWeightKg: 42600,
  },
  departureIcao: "LFPG",
  plannedArrivalIcao: "LFBO",
  openedAt: "2026-11-11T08:15:30.250Z",
  trackerVersion: "0.1.0",
});

describe("flight phases", () => {
  it("has the 12 phases of spec T0, from BOARDING to ARRIVED", () => {
    expect(FLIGHT_PHASES).toHaveLength(12);
    expect(FLIGHT_PHASES[0]).toBe("BOARDING");
    expect(FLIGHT_PHASES[11]).toBe("ARRIVED");
  });
});

describe("OpenFlightRequest", () => {
  it("accepts a flight opened by the tracker", () => {
    expect(OpenFlightRequest.safeParse(openFlight()).success).toBe(true);
  });

  it("requires a UUID v7 flight id", () => {
    const request = { ...openFlight(), flightId: FLIGHT_ID_V4 };
    expect(OpenFlightRequest.safeParse(request).success).toBe(false);
  });

  it("rejects a lowercase ICAO code", () => {
    expect(OpenFlightRequest.safeParse({ ...openFlight(), departureIcao: "lfpg" }).success).toBe(
      false,
    );
  });

  it("rejects a time that is not UTC ISO 8601", () => {
    const request = { ...openFlight(), openedAt: "11/11/2026 09:15" };
    expect(OpenFlightRequest.safeParse(request).success).toBe(false);
  });
});

describe("PositionReport", () => {
  it("accepts a live position", () => {
    const position = {
      seq: 12,
      at: "2026-11-11T08:40:00.000Z",
      lat: 46.5,
      lon: 1.9,
      altMsl: 36000,
      gs: 452,
      heading: 185,
      vs: 0,
      phase: "CRUISE",
      onGround: false,
    };
    expect(PositionReport.safeParse(position).success).toBe(true);
    expect(PositionReport.safeParse({ ...position, phase: "HOLDING" }).success).toBe(false);
  });
});

describe("FlightEventsRequest", () => {
  it("rejects an empty batch", () => {
    expect(FlightEventsRequest.safeParse({ events: [] }).success).toBe(false);
  });

  it("accepts a phase change with its context", () => {
    const batch = {
      events: [
        {
          seq: 3,
          at: "2026-11-11T08:20:00.000Z",
          type: "phaseChanged",
          context: { from: "TAXI_OUT", to: "TAKEOFF" },
        },
      ],
    };
    expect(FlightEventsRequest.safeParse(batch).success).toBe(true);
  });
});

describe("CloseFlightRequest and FlightView", () => {
  it("accepts a normal closure", () => {
    const close = { closedAt: "2026-11-11T09:30:00.000Z", reason: "normal" };
    expect(CloseFlightRequest.safeParse(close).success).toBe(true);
  });

  it("describes an open flight with no closure yet", () => {
    const { trackerVersion: _unused, ...flight } = openFlight();
    const view = { ...flight, closedAt: null, closeReason: null, lastPhase: null, events: [] };
    expect(FlightView.safeParse(view).success).toBe(true);
  });
});
