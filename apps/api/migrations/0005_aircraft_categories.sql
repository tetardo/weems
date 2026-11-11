ALTER TABLE "flights" ADD COLUMN "aircraft_engine_type" text;--> statement-breakpoint
ALTER TABLE "flights" ADD COLUMN "aircraft_airframe" text;--> statement-breakpoint
ALTER TABLE "flights" ADD COLUMN "aircraft_max_gross_weight_kg" double precision;--> statement-breakpoint
ALTER TABLE "flights" ADD COLUMN "aircraft_category" text;--> statement-breakpoint
ALTER TABLE "flights" ADD COLUMN "aircraft_category_estimated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "flights_pilot_category_idx" ON "flights" USING btree ("pilot_id","aircraft_category");