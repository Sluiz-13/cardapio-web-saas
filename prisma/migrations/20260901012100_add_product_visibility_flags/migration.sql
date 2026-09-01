-- AlterTable
ALTER TABLE "products" ADD COLUMN     "visibleToCustomer" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "visibleToStaff" BOOLEAN NOT NULL DEFAULT true;
