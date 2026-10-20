-- CreateEnum
CREATE TYPE "PrintFontSize" AS ENUM ('AUTO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "PrintSpacing" AS ENUM ('COMPACT', 'NORMAL', 'WIDE');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "printFontSize" "PrintFontSize" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "printSpacing" "PrintSpacing" NOT NULL DEFAULT 'NORMAL';
