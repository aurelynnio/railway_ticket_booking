CREATE TABLE IF NOT EXISTS "ticket_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"name" text,
	"description" text,
	"coach_code" text,
	"seat_class" text,
	"seat_type" text,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"seat_labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"available_seat_labels" text[] DEFAULT '{}'::text[] NOT NULL,
	"stock_initial" integer,
	"stock_available" integer,
	"is_stock_prepared" boolean DEFAULT false NOT NULL,
	"price_original" bigint,
	"price_flash" bigint,
	"sale_start_time" timestamp (3),
	"sale_end_time" timestamp (3),
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now(),
	"deleted_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text,
	"train_number" text,
	"departure_station_code" text,
	"departure_station_name" text,
	"arrival_station_code" text,
	"arrival_station_name" text,
	"journey_note" text,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"date_start" timestamp (3),
	"date_end" timestamp (3),
	"status" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now(),
	"deleted_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD COLUMN IF NOT EXISTS "images" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ticket_items_ticket_id_idx" ON "ticket_items" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_status_date_start_idx" ON "tickets" USING btree ("status","date_start");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_departure_station_code_arrival_station_code_idx" ON "tickets" USING btree ("departure_station_code","arrival_station_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_train_number_idx" ON "tickets" USING btree ("train_number");--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ticket_items" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "ticket_items" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "ticket_items" ALTER COLUMN "updated_at" SET DEFAULT now();