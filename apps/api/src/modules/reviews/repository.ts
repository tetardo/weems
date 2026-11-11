import { eq } from "drizzle-orm";
import type { FlightReview, FlightReviewView } from "@weems/contrats";
import type { Database } from "../../db/client.ts";
import { flightReviews } from "../../db/schema.ts";

/** The only place that reads and writes the pilots' reviews of their flights' phases. */
export class ReviewsRepository {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async find(flightId: string): Promise<FlightReviewView | null> {
    const rows = await this.db
      .select({
        phases: flightReviews.phases,
        note: flightReviews.note,
        reviewedAt: flightReviews.reviewedAt,
      })
      .from(flightReviews)
      .where(eq(flightReviews.flightId, flightId));
    const row = rows[0];
    return row
      ? {
          phases: row.phases as FlightReview["phases"],
          note: row.note,
          reviewedAt: row.reviewedAt.toISOString(),
        }
      : null;
  }

  /** One review per flight: a new one replaces the previous one. */
  async save(flightId: string, review: FlightReview, reviewedAt: Date): Promise<void> {
    const values = { phases: review.phases, note: review.note, reviewedAt };
    await this.db
      .insert(flightReviews)
      .values({ flightId, ...values })
      .onConflictDoUpdate({ target: flightReviews.flightId, set: values });
  }
}
