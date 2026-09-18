-- Custom SQL migration file, put your code below! --

-- Real, database-level protection against double bookings (race-condition safe),
-- in addition to the application-level checks in booking-service.ts.
-- A PENDING or CONFIRMED booking may not overlap in time with any other
-- PENDING or CONFIRMED booking, regardless of service (single photographer calendar).
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    tstzrange("start_at", "end_at") WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED'));
