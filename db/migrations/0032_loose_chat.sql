CREATE TABLE "photo_event_notices" (
	"id" text PRIMARY KEY NOT NULL,
	"service_id" text NOT NULL,
	"event_date" text NOT NULL,
	"order_deadline" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "photo_ready_email_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "photo_event_notices" ADD CONSTRAINT "photo_event_notices_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "photo_event_notices_service_date_idx" ON "photo_event_notices" USING btree ("service_id","event_date");