-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "cashbackEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cashbackPercent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loyaltyPointsPerReal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsRedeemThreshold" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "loyaltyPointsRedeemValueCents" INTEGER NOT NULL DEFAULT 0;
