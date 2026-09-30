CREATE TABLE "availability_date_overrides" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "availability_date_overrides_date_idx" ON "availability_date_overrides" USING btree ("date");--> statement-breakpoint
CREATE INDEX "availability_date_overrides_active_idx" ON "availability_date_overrides" USING btree ("active");