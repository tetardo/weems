CREATE TABLE "flight_tracks" (
	"flight_id" uuid PRIMARY KEY NOT NULL,
	"recorded_points" integer NOT NULL,
	"sha256" text NOT NULL,
	"points" "bytea" NOT NULL,
	"simplified" jsonb NOT NULL,
	"received_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flight_tracks" ADD CONSTRAINT "flight_tracks_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;