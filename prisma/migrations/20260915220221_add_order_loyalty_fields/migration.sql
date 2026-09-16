-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "cashbackUsedCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyDiscountCents" INTEGER NOT NULL DEFAULT 0;
