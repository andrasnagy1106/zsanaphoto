CREATE TABLE "event_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"pin" text NOT NULL,
	"public_id" text NOT NULL,
	"secure_url" text NOT NULL,
	"watermarked_url" text NOT NULL,
	"original_filename" text,
	"title" text NOT NULL,
	"width" integer,
	"height" integer,
	"bytes" integer,
	"format" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_photos_public_id_idx" ON "event_photos" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "event_photos_booking_id_idx" ON "event_photos" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "event_photos_pin_idx" ON "event_photos" USING btree ("pin");--> statement-breakpoint
CREATE INDEX "event_photos_sort_order_idx" ON "event_photos" USING btree ("sort_order");