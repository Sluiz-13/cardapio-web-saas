-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "defaultDeliveryFeeCents" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "delivery_fees" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "delivery_fees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "delivery_fees_restaurantId_neighborhood_key" ON "delivery_fees"("restaurantId", "neighborhood");

-- AddForeignKey
ALTER TABLE "delivery_fees" ADD CONSTRAINT "delivery_fees_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
