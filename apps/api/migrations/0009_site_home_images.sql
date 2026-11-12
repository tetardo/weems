CREATE TABLE "site_home_images" (
	"theme" text PRIMARY KEY NOT NULL,
	"webp" "bytea" NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"focus" text NOT NULL,
	"credit" text NOT NULL,
	"licence" text NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "site_home_images" ADD CONSTRAINT "site_home_images_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;