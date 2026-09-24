-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "useDeliveryZones" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "feeCents" INTEGER NOT NULL,
    "minOrderCents" INTEGER,
    "estimatedMinutes" INTEGER,
    "neighborhoods" TEXT[],
    "geoJson" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "pauseReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_zones_restaurantId_idx" ON "delivery_zones"("restaurantId");

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
