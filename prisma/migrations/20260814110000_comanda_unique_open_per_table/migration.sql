-- Garante que nunca existam 2 comandas ABERTAS na mesma mesa ao mesmo
-- tempo, mesmo se 2 pedidos chegarem quase simultaneamente na mesma mesa.
-- É um índice PARCIAL (só considera linhas com status = 'OPEN') — por
-- isso não dá pra declarar isso direto no schema.prisma, só via SQL puro.
CREATE UNIQUE INDEX "comandas_one_open_per_table" ON "comandas"("tableId") WHERE "status" = 'OPEN';