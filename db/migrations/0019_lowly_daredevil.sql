ALTER TABLE "services" ADD COLUMN "generates_pin" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "services" SET "generates_pin" = true WHERE "slug" = 'intezmenyi-fotozas';
