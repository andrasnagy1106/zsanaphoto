ALTER TABLE "photo_event_notices" ADD COLUMN "payment_deadline" text;--> statement-breakpoint
ALTER TABLE "photo_event_notices" ADD COLUMN "payment_information" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "payment_information" text;