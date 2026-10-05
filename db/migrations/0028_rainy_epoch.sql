ALTER TABLE "bookings" DROP COLUMN "service_price";--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "service_price";--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "default_service_price";