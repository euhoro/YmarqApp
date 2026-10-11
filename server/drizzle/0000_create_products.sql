CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" text NOT NULL,
	"description" text NOT NULL,
	"hashtag" text DEFAULT '' NOT NULL,
	"image_url" text,
	"price" numeric,
	"currency" text,
	"category" text,
	"location" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "products_publisher_id_idx" ON "products" USING btree ("publisher_id");