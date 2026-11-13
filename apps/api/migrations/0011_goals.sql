CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pilot_id" uuid NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"archived_at" timestamp (3) with time zone
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_pilot_idx" ON "goals" USING btree ("pilot_id");