-- CreateTable
CREATE TABLE "platform_payments" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_payments_restaurantId_idx" ON "platform_payments"("restaurantId");

-- CreateIndex
CREATE INDEX "platform_payments_confirmedAt_idx" ON "platform_payments"("confirmedAt");

-- AddForeignKey
ALTER TABLE "platform_payments" ADD CONSTRAINT "platform_payments_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
