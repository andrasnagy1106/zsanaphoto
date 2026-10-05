CREATE TABLE "availability_calendar_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"calendar_id" text NOT NULL,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_calendars" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "availability_calendar_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "online_booking_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "availability_calendar_slots" ADD CONSTRAINT "availability_calendar_slots_calendar_id_availability_calendars_id_fk" FOREIGN KEY ("calendar_id") REFERENCES "public"."availability_calendars"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "availability_calendar_slots_unique_idx" ON "availability_calendar_slots" USING btree ("calendar_id","date","start_time","end_time");--> statement-breakpoint
CREATE INDEX "availability_calendar_slots_calendar_date_idx" ON "availability_calendar_slots" USING btree ("calendar_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "availability_calendars_name_idx" ON "availability_calendars" USING btree ("name");--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_availability_calendar_id_availability_calendars_id_fk" FOREIGN KEY ("availability_calendar_id") REFERENCES "public"."availability_calendars"("id") ON DELETE set null ON UPDATE no action;