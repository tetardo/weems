CREATE TABLE "test_plans" (
	"pilot_id" uuid PRIMARY KEY NOT NULL,
	"plan" text NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "test_plans" ADD CONSTRAINT "test_plans_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;