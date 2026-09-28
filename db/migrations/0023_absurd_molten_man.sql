ALTER TABLE "bookings" ALTER COLUMN "show_photo_titles" SET DEFAULT false;--> statement-breakpoint
UPDATE "bookings" SET "show_photo_titles" = false;--> statement-breakpoint
-- Clear captions that are just camera file names (e.g. "_DSC4735", "IMG_1234").
UPDATE "gallery_photos" SET "caption" = '' WHERE "caption" ~ '^_?[A-Za-z]{2,5}[_-]?[0-9]{3,}([_ -].*)?$';