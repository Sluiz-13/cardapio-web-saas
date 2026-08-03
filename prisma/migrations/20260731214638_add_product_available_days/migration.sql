-- AlterTable
ALTER TABLE "products" ADD COLUMN     "availableDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
