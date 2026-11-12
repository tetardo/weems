CREATE TABLE "profile_hidden_flights" (
	"flight_id" uuid PRIMARY KEY NOT NULL,
	"pilot_id" uuid NOT NULL,
	"hidden_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_photos" (
	"pilot_id" uuid PRIMARY KEY NOT NULL,
	"webp" "bytea" NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pilot_profiles" (
	"pilot_id" uuid PRIMARY KEY NOT NULL,
	"handle" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"country" text,
	"home_icao" text,
	"level" text,
	"vatsim_id" text,
	"ivao_id" text,
	"simbrief_id" text,
	"published_at" timestamp (3) with time zone,
	"unpublished_at" timestamp (3) with time zone,
	"updated_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "pilot_profiles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
ALTER TABLE "profile_hidden_flights" ADD CONSTRAINT "profile_hidden_flights_flight_id_flights_id_fk" FOREIGN KEY ("flight_id") REFERENCES "public"."flights"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_photos" ADD CONSTRAINT "pilot_photos_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_profiles" ADD CONSTRAINT "pilot_profiles_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "profile_hidden_flights_pilot_idx" ON "profile_hidden_flights" USING btree ("pilot_id");--> statement-breakpoint
CREATE INDEX "pilot_profiles_public_idx" ON "pilot_profiles" USING btree ("is_public");