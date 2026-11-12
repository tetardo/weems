ALTER TABLE "invitations" ADD COLUMN "role" text DEFAULT 'pilot' NOT NULL;--> statement-breakpoint
ALTER TABLE "invitations" ADD COLUMN "expires_at" timestamp (3) with time zone DEFAULT now() + interval '14 days' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'pilot' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "disabled_at" timestamp (3) with time zone;