-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ticket_item_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "ticket_title" VARCHAR(180) NOT NULL,
    "train_number" VARCHAR(64),
    "departure_station_code" VARCHAR(24),
    "departure_station_name" VARCHAR(120),
    "arrival_station_code" VARCHAR(24),
    "arrival_station_name" VARCHAR(120),
    "departure_time" TIMESTAMP(3),
    "arrival_time" TIMESTAMP(3),
    "coach_code" VARCHAR(48),
    "seat_class" VARCHAR(80),
    "seat_type" VARCHAR(80),
    "quantity" INTEGER NOT NULL,
    "unit_price" BIGINT NOT NULL,
    "total_price" BIGINT NOT NULL,
    "ticket_code" VARCHAR(24),
    "qr_payload" VARCHAR(2000),
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_seat_labels" (
    "order_id" UUID NOT NULL,
    "seat_label" VARCHAR(32) NOT NULL,

    CONSTRAINT "order_seat_labels_pkey" PRIMARY KEY ("order_id","seat_label")
);

-- CreateTable
CREATE TABLE "order_passengers" (
    "order_id" UUID NOT NULL,
    "full_name" VARCHAR(120) NOT NULL,
    "passenger_type" VARCHAR(40) NOT NULL,
    "identity_number" VARCHAR(40),
    "phone_number" VARCHAR(24),

    CONSTRAINT "order_passengers_pkey" PRIMARY KEY ("order_id","full_name","passenger_type")
);

-- CreateIndex
CREATE UNIQUE INDEX "orders_ticket_code_key" ON "orders"("ticket_code");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_ticket_id_idx" ON "orders"("ticket_id");

-- CreateIndex
CREATE INDEX "orders_ticket_item_id_idx" ON "orders"("ticket_item_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_status_deleted_at_created_at_id_idx" ON "orders"("status", "deleted_at", "created_at", "id");

-- AddForeignKey
ALTER TABLE "order_seat_labels" ADD CONSTRAINT "order_seat_labels_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_passengers" ADD CONSTRAINT "order_passengers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
