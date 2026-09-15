-- CreateEnum
CREATE TYPE "MenuTheme" AS ENUM ('CLASSIC', 'PREMIUM');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "menuTheme" "MenuTheme" NOT NULL DEFAULT 'CLASSIC';
