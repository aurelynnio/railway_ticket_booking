CREATE TABLE IF NOT EXISTS "order_passengers" (
	"order_id" uuid NOT NULL,
	"full_name" varchar(120) NOT NULL,
	"passenger_type" varchar(40) NOT NULL,
	"identity_number" varchar(40),
	"phone_number" varchar(24),
	CONSTRAINT "order_passengers_pkey" PRIMARY KEY("order_id","full_name","passenger_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_seat_labels" (
	"order_id" uuid NOT NULL,
	"seat_label" varchar(32) NOT NULL,
	CONSTRAINT "order_seat_labels_pkey" PRIMARY KEY("order_id","seat_label")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"ticket_item_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"ticket_title" varchar(180) NOT NULL,
	"train_number" varchar(64),
	"departure_station_code" varchar(24),
	"departure_station_name" varchar(120),
	"arrival_station_code" varchar(24),
	"arrival_station_name" varchar(120),
	"departure_time" timestamp (3),
	"arrival_time" timestamp (3),
	"coach_code" varchar(48),
	"seat_class" varchar(80),
	"seat_type" varchar(80),
	"quantity" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"total_price" bigint NOT NULL,
	"voucher_id" uuid,
	"voucher_code" varchar(32),
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"ticket_code" varchar(24),
	"qr_payload" varchar(2000),
	"idempotency_key" varchar(64),
	"contact_email" varchar(255),
	"contact_phone" varchar(24),
	"cancel_reason" varchar(255),
	"status" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3),
	CONSTRAINT "orders_ticket_code_unique" UNIQUE("ticket_code"),
	CONSTRAINT "orders_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voucher_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"voucher_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"discount_amount" bigint NOT NULL,
	"used_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "voucher_usages_voucher_id_order_id_key" UNIQUE("voucher_id","order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vouchers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(32) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"discount_type" varchar(20) NOT NULL,
	"discount_value" bigint NOT NULL,
	"max_discount" bigint,
	"min_order_amount" bigint,
	"usage_limit" integer,
	"per_user_limit" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"valid_from" timestamp (3) DEFAULT now() NOT NULL,
	"valid_to" timestamp (3) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"deleted_at" timestamp (3),
	CONSTRAINT "vouchers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "idempotency_key" varchar(64);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(24);--> statement-breakpoint
ALTER TABLE "vouchers" ADD COLUMN IF NOT EXISTS "per_user_limit" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_passengers" ADD CONSTRAINT "order_passengers_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_seat_labels" ADD CONSTRAINT "order_seat_labels_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voucher_usages" ADD CONSTRAINT "voucher_usages_voucher_id_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."vouchers"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_ticket_id_idx" ON "orders" USING btree ("ticket_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_ticket_item_id_idx" ON "orders" USING btree ("ticket_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_voucher_id_idx" ON "orders" USING btree ("voucher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_status_deleted_at_created_at_id_idx" ON "orders" USING btree ("status","deleted_at","created_at","id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voucher_usages_user_id_idx" ON "voucher_usages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vouchers_code_idx" ON "vouchers" USING btree ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "vouchers_is_active_valid_from_valid_to_idx" ON "vouchers" USING btree ("is_active","valid_from","valid_to");--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "vouchers" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "voucher_usages" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "voucher_usages" ALTER COLUMN "used_at" SET DEFAULT now();