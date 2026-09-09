-- AlterTable
ALTER TABLE "orders" ADD COLUMN "contact_email" VARCHAR(255);
ALTER TABLE "orders" ADD COLUMN "contact_phone" VARCHAR(24);
ALTER TABLE "orders" ADD COLUMN "cancel_reason" VARCHAR(255);
