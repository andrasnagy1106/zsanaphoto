ALTER TABLE "bookings" ADD COLUMN "service_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "service_price" integer;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "default_service_price" integer DEFAULT 0 NOT NULL;