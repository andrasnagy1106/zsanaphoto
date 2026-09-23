CREATE TABLE "gallery_photos" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"public_id" text NOT NULL,
	"secure_url" text NOT NULL,
	"caption" text NOT NULL,
	"width" integer,
	"height" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_photos_public_id_idx" ON "gallery_photos" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "gallery_photos_category_idx" ON "gallery_photos" USING btree ("category");--> statement-breakpoint
CREATE INDEX "gallery_photos_sort_order_idx" ON "gallery_photos" USING btree ("sort_order");