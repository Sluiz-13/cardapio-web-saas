-- Produtos criados antes da coluna "order" existir ficaram todos com 0
-- (valor padrão da migration anterior). Sem valores distintos, trocar a
-- posição de dois produtos não tem efeito nenhum (0 vira 0). Esse backfill
-- dá um valor sequencial pra cada produto, por categoria, baseado na ordem
-- de criação — só serve pra destravar o recurso, depois disso o admin
-- reordena manualmente pra como quiser.
UPDATE "products" p
SET "order" = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "categoryId" ORDER BY "createdAt" ASC) - 1 AS rn
  FROM "products"
) sub
WHERE p.id = sub.id;