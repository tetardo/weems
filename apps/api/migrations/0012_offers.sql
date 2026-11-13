CREATE SEQUENCE "public"."founder_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "ambassadors" (
	"slug" text PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"pilot_id" uuid,
	"active" boolean NOT NULL,
	"photo" "bytea",
	"updated_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "ambassadors_campaign_id_unique" UNIQUE("campaign_id")
);
--> statement-breakpoint
CREATE TABLE "founders" (
	"number" integer PRIMARY KEY DEFAULT nextval('founder_number_seq') NOT NULL,
	"pilot_id" uuid NOT NULL,
	"qualified_at" timestamp (3) with time zone NOT NULL,
	"confirmed_at" timestamp (3) with time zone,
	"refused_at" timestamp (3) with time zone,
	CONSTRAINT "founders_pilot_id_unique" UNIQUE("pilot_id")
);
--> statement-breakpoint
CREATE TABLE "offer_campaigns" (
	"id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"label" text NOT NULL,
	"code" text,
	"months" integer NOT NULL,
	"places" integer,
	"expires_at" timestamp (3) with time zone,
	"cancelled_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "offer_campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offer_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"owner_id" uuid,
	"expires_at" timestamp (3) with time zone,
	"used_by" uuid,
	"used_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offer_redemptions" (
	"campaign_id" uuid NOT NULL,
	"pilot_id" uuid NOT NULL,
	"code" text NOT NULL,
	"redeemed_at" timestamp (3) with time zone NOT NULL,
	CONSTRAINT "offer_redemptions_campaign_id_pilot_id_pk" PRIMARY KEY("campaign_id","pilot_id")
);
--> statement-breakpoint
CREATE TABLE "plan_grants" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pilot_id" uuid NOT NULL,
	"plan" text NOT NULL,
	"source" text NOT NULL,
	"starts_at" timestamp (3) with time zone NOT NULL,
	"ends_at" timestamp (3) with time zone NOT NULL,
	"revoked_at" timestamp (3) with time zone,
	"created_at" timestamp (3) with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_campaign_id_offer_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."offer_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ambassadors" ADD CONSTRAINT "ambassadors_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "founders" ADD CONSTRAINT "founders_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_campaign_id_offer_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."offer_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_codes" ADD CONSTRAINT "offer_codes_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_redemptions" ADD CONSTRAINT "offer_redemptions_campaign_id_offer_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."offer_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_redemptions" ADD CONSTRAINT "offer_redemptions_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_grants" ADD CONSTRAINT "plan_grants_pilot_id_users_id_fk" FOREIGN KEY ("pilot_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "offer_codes_campaign_idx" ON "offer_codes" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "offer_codes_owner_idx" ON "offer_codes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "plan_grants_pilot_idx" ON "plan_grants" USING btree ("pilot_id","ends_at");