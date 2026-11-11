CREATE TABLE "flight_reviews" (
	"flight_id" uuid PRIMARY KEY NOT NULL,
	"phases" text NOT NULL,
	"note" text NOT NULL,
	"reviewed_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flight_reviews" ADD CONSTRAINT "flight_reviews_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;