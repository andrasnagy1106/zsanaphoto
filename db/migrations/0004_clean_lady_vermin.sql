ALTER TABLE "bookings" ADD COLUMN "pin" text;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_pin_idx" ON "bookings" USING btree ("pin");