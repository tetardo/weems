import type { FlightReview, FlightReviewView } from "@weems/contrats";
import type { Caller } from "../../plugins/auth.ts";
import { notFound } from "../../plugins/problem.ts";
import type { FlightsService } from "../flights/service.ts";
import type { ReviewsRepository } from "./repository.ts";

/**
 * The pilot says whether the phases of a flight are right (J3 alpha, criterion "phases correct on
 * at least 95 % of the flights checked by hand"). Only the flight's pilot can read or write it.
 */
export class ReviewsService {
  private readonly repository: ReviewsRepository;
  private readonly flights: FlightsService;

  constructor(repository: ReviewsRepository, flights: FlightsService) {
    this.repository = repository;
    this.flights = flights;
  }

  async read(caller: Caller, flightId: string): Promise<FlightReviewView> {
    await this.flights.read(caller, flightId); // 404 if not the caller's
    const review = await this.repository.find(flightId);
    if (!review) throw notFound(`Flight ${flightId} has no review yet.`);
    return review;
  }

  async save(caller: Caller, flightId: string, review: FlightReview): Promise<FlightReviewView> {
    await this.flights.read(caller, flightId);
    const reviewedAt = new Date();
    await this.repository.save(flightId, review, reviewedAt);
    return { ...review, reviewedAt: reviewedAt.toISOString() };
  }
}
