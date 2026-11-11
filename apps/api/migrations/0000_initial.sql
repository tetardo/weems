CREATE TABLE "flight_events" (
	"flight_id" uuid NOT NULL,
	"seq" bigint NOT NULL,
	"at" timestamp (3) with time zone NOT NULL,
	"type" text NOT NULL,
	"context" jsonb NOT NULL,
	CONSTRAINT "flight_events_flight_id_seq_pk" PRIMARY KEY("flight_id","seq")
);
--> statement-breakpoint
CREATE TABLE "flights" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pilot_id" uuid NOT NULL,
	"callsign" text NOT NULL,
	"simulator" text NOT NULL,
	"aircraft_title" text NOT NULL,
	"aircraft_model" text,
	"aircraft_registration" text,
	"aircraft_engine_count" smallint NOT NULL,
	"aircraft_empty_weight_kg" double precision,
	"departure_icao" text,
	"planned_arrival_icao" text,
	"opened_at" timestamp (3) with time zone NOT NULL,
	"closed_at" timestamp (3) with time zone,
	"close_reason" text,
	"tracker_version" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flight_events" ADD CONSTRAINT "flight_events_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "flights_pilot_opened_idx" ON "flights" USING btree ("pilot_id","opened_at");