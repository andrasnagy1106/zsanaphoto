ALTER TABLE "bookings" ADD COLUMN "custom_photo_prices" jsonb;--> statement-breakpoint
ALTER TABLE "photo_order_items" ADD COLUMN "unit_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "photo_order_items" ADD COLUMN "total_price" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "photo_orders" ADD COLUMN "total_amount" integer DEFAULT 0 NOT NULL;