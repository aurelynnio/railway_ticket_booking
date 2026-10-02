-- =============================================================================
-- Voucher tables + per-user limit.
--
-- This migration ALSO repairs pre-existing drift: `vouchers` and
-- `voucher_usages` were declared in schema.prisma but never created by any
-- migration, and `orders` was missing its voucher columns. A database built
-- purely from the migration history therefore had no voucher tables at all,
-- which is why a plain `ALTER TABLE "vouchers" ...` failed on deploy.
--
-- Every statement is guarded (IF NOT EXISTS / pg_constraint lookup) so this is
-- safe whether the tables are absent, or were previously created out-of-band
-- (e.g. by `prisma db push`).
-- =============================================================================

-- CreateTable
CREATE TABLE IF NOT EXISTS "vouchers" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "discount_type" VARCHAR(20) NOT NULL,
    "discount_value" BIGINT NOT NULL,
    "max_discount" BIGINT,
    "min_order_amount" BIGINT,
    "usage_limit" INTEGER,
    "per_user_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "voucher_usages" (
    "id" UUID NOT NULL,
    "voucher_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "discount_amount" BIGINT NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_usages_pkey" PRIMARY KEY ("id")
);

-- Bring an out-of-band `vouchers` table up to the current schema.
ALTER TABLE "vouchers" ADD COLUMN IF NOT EXISTS "per_user_limit" INTEGER;
ALTER TABLE "vouchers" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "vouchers_code_key" ON "vouchers"("code");
CREATE INDEX IF NOT EXISTS "vouchers_code_idx" ON "vouchers"("code");
CREATE INDEX IF NOT EXISTS "vouchers_is_active_valid_from_valid_to_idx" ON "vouchers"("is_active", "valid_from", "valid_to");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "voucher_usages_voucher_id_order_id_key" ON "voucher_usages"("voucher_id", "order_id");
CREATE INDEX IF NOT EXISTS "voucher_usages_user_id_idx" ON "voucher_usages"("user_id");

-- AddForeignKey (guarded: ADD CONSTRAINT has no IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'voucher_usages_voucher_id_fkey'
    ) THEN
        ALTER TABLE "voucher_usages"
            ADD CONSTRAINT "voucher_usages_voucher_id_fkey"
            FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- =============================================================================
-- Repair the `orders` voucher columns for databases baselined from db push.
-- =============================================================================
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "voucher_id" UUID;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "voucher_code" VARCHAR(32);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "discount_amount" BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "orders_voucher_id_idx" ON "orders"("voucher_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'orders_voucher_id_fkey'
    ) THEN
        ALTER TABLE "orders"
            ADD CONSTRAINT "orders_voucher_id_fkey"
            FOREIGN KEY ("voucher_id") REFERENCES "vouchers"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
