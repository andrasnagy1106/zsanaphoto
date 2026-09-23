CREATE TABLE "site_photos" (
	"key" text PRIMARY KEY NOT NULL,
	"public_id" text NOT NULL,
	"secure_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
