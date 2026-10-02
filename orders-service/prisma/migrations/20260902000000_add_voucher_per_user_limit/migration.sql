-- Optional per-customer cap for a voucher.
-- NULL keeps the previous behaviour (only the global usage_limit applies).
ALTER TABLE "vouchers" ADD COLUMN "per_user_limit" INTEGER;
