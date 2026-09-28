ALTER TABLE "bookings" ADD COLUMN "show_photo_titles" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "event_photos" ADD COLUMN "focus_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "event_photos" ADD COLUMN "focus_y" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD COLUMN "show_caption" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD COLUMN "focus_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD COLUMN "focus_y" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_photos" ADD COLUMN "focus_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_photos" ADD COLUMN "focus_y" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "about_photo_focus_x" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "about_photo_focus_y" integer DEFAULT 50 NOT NULL;