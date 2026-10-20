-- CreateTable
CREATE TABLE "restaurant_banners" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "couponId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restaurant_banners_restaurantId_position_idx" ON "restaurant_banners"("restaurantId", "position");

-- AddForeignKey
ALTER TABLE "restaurant_banners" ADD CONSTRAINT "restaurant_banners_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_banners" ADD CONSTRAINT "restaurant_banners_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
