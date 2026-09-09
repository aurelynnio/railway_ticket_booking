-- CreateEnum
-- (no enums in this schema)

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "title" TEXT,
    "train_number" TEXT,
    "departure_station_code" TEXT,
    "departure_station_name" TEXT,
    "arrival_station_code" TEXT,
    "arrival_station_name" TEXT,
    "journey_note" TEXT,
    "date_start" TIMESTAMP(3),
    "date_end" TIMESTAMP(3),
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_items" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "coach_code" TEXT,
    "seat_class" TEXT,
    "seat_type" TEXT,
    "seat_labels" TEXT[],
    "available_seat_labels" TEXT[],
    "stock_initial" INTEGER,
    "stock_available" INTEGER,
    "is_stock_prepared" BOOLEAN NOT NULL DEFAULT false,
    "price_original" BIGINT,
    "price_flash" BIGINT,
    "sale_start_time" TIMESTAMP(3),
    "sale_end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ticket_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_status_date_start_idx" ON "tickets"("status", "date_start");

-- CreateIndex
CREATE INDEX "tickets_departure_station_code_arrival_station_code_idx" ON "tickets"("departure_station_code", "arrival_station_code");

-- CreateIndex
CREATE INDEX "tickets_train_number_idx" ON "tickets"("train_number");

-- CreateIndex
CREATE INDEX "ticket_items_ticket_id_idx" ON "ticket_items"("ticket_id");

-- AddForeignKey
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
