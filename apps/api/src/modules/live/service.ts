import type { LiveRoute } from "@weems/contrats";
import type { AirportsService } from "../airports/service.ts";
import { notFound } from "../../plugins/problem.ts";
import type { LiveBoard } from "./live-board.ts";

/** What the live map asks besides the stream: the route of the flight the spectator selects. */
export class LiveService {
  private readonly board: LiveBoard;
  private readonly airports: AirportsService;

  constructor(board: LiveBoard, airports: AirportsService) {
    this.board = board;
    this.airports = airports;
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
