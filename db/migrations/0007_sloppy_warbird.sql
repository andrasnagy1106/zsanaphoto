CREATE TYPE "public"."photo_order_status" AS ENUM('NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "photo_order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"photo_id" text NOT NULL,
	"photo_title" text NOT NULL,
	"size" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photo_orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"booking_id" text NOT NULL,
	"status" "photo_order_status" DEFAULT 'NEW' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photo_order_items" ADD CONSTRAINT "photo_order_items_order_id_photo_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."photo_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photo_orders" ADD CONSTRAINT "photo_orders_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photo_order_items_order_id_idx" ON "photo_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "photo_orders_order_number_idx" ON "photo_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "photo_orders_booking_id_idx" ON "photo_orders" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "photo_orders_status_idx" ON "photo_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "photo_orders_created_at_idx" ON "photo_orders" USING btree ("created_at");--> statement-breakpoint
UPDATE "bookings"
SET "pin" = NULL, "updated_at" = now()
WHERE "service_id" IN (
	SELECT "id" FROM "services" WHERE "slug" <> 'intezmenyi-fotozas'
);