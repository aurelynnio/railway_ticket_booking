-- CreateTable
CREATE TABLE "payment_outbox" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "user_id" UUID,
    "transaction_id" UUID NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "payment_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_outbox_status_next_attempt_at_idx" ON "payment_outbox"("status", "next_attempt_at");
