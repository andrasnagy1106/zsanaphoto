CREATE TYPE "public"."service_availability_mode" AS ENUM('GLOBAL', 'CUSTOM');--> statement-breakpoint
CREATE TABLE "service_availability_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"day_of_week" smallint NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "availability_mode" "service_availability_mode" DEFAULT 'GLOBAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "date_range_start" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "date_range_end" text;--> statement-breakpoint
ALTER TABLE "service_availability_rules" ADD CONSTRAINT "service_availability_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_availability_rules_service_id_idx" ON "service_availability_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "service_availability_rules_day_of_week_idx" ON "service_availability_rules" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "service_availability_rules_active_idx" ON "service_availability_rules" USING btree ("active");