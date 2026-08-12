-- CreateEnum
CREATE TYPE "PrintMethod" AS ENUM ('MANUAL', 'RAWBT', 'AGENT');

-- AlterTable
-- Default MANUAL preserva o comportamento atual pra todo restaurante já
-- existente em produção — ninguém muda de método sem escolher explicitamente.
ALTER TABLE "restaurants" ADD COLUMN     "printMethod" "PrintMethod" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "printerIp" TEXT,
ADD COLUMN     "printerPort" INTEGER DEFAULT 9100;

-- AlterTable
-- NULL = ainda não impresso. Pedidos antigos ficam com NULL, o que é
-- inofensivo: nada reimprime pedido antigo automaticamente, só novos
-- pedidos entram no fluxo de impressão a partir de agora.
ALTER TABLE "orders" ADD COLUMN     "printedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_restaurantId_printedAt_idx" ON "orders"("restaurantId", "printedAt");