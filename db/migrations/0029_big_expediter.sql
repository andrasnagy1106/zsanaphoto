ALTER TABLE "services" ADD COLUMN "custom_photo_prices" jsonb;--> statement-breakpoint
UPDATE "services" AS service
SET "custom_photo_prices" = latest_booking_prices.prices
FROM (
	SELECT DISTINCT ON ("service_id") "service_id", "custom_photo_prices" AS prices
	FROM "bookings"
	WHERE "custom_photo_prices" IS NOT NULL
	ORDER BY "service_id", "updated_at" DESC, "created_at" DESC
) AS latest_booking_prices
WHERE service."id" = latest_booking_prices."service_id";--> statement-breakpoint
ALTER TABLE "bookings" DROP COLUMN "custom_photo_prices";