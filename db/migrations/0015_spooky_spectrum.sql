ALTER TABLE "bookings" ADD COLUMN "child_name" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "requires_child_name" boolean DEFAULT false NOT NULL;