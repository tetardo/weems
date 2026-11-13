import type { Boarding, LiveRoute } from "@weems/contrats";
import type { AirportsService } from "../airports/service.ts";
import { notFound } from "../../plugins/problem.ts";
import { buildBoarding } from "./boarding.ts";
import type { LiveBoard } from "./live-board.ts";

/**
 * What the live map asks besides the stream (the route of the flight the spectator selects), and
 * the page Boarding.
 */
export class LiveService {
  private readonly board: LiveBoard;
  private readonly airports: AirportsService;
  private readonly now: () => number;

  constructor(board: LiveBoard, airports: AirportsService, now: () => number = Date.now) {
    this.board = board;
    this.airports = airports;
    this.now = now;
  }

  /** The Departures and Arrivals boards (spec web Boarding). */
  boarding(): Boarding {
    const { live, landed } = this.board.boardingSources();
    return buildBoarding(live, landed, (icao) => this.airports.find(icao), this.now());
  }

  route(flightId: string): LiveRoute {
    const flight = this.board.flight(flightId);
    if (!flight) throw notFound(`Flight ${flightId} is not on the live map.`);
    return {
      departure: this.airports.find(flight.departureIcao),
      arrival: this.airports.find(flight.plannedArrivalIcao),
      trail: this.board.trails.of(flightId),
    };
  }
}
