CREATE TABLE "database_size_readings" (
	"day" date PRIMARY KEY NOT NULL,
	"total_bytes" bigint NOT NULL,
	"tables" jsonb NOT NULL,
	"recorded_at" timestamp (3) with time zone NOT NULL
);
