-- AlterEnum
ALTER TYPE "PrintMethod" ADD VALUE 'QZ_TRAY';

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "printerQzName" TEXT;
