-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "dailyNumber" INTEGER;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "dailyCounterEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dailyCounterNext" INTEGER NOT NULL DEFAULT 1;
