import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// Pedidos finalizados (entregues ou cancelados) há mais desse tanto de dias
// têm o dado pessoal removido, mas o valor/itens continuam existindo para
// fins contábeis — só perde o vínculo com a identidade do cliente.
const RETENTION_DAYS = 90;

async function main() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  const result = await db.order.updateMany({
    where: {
      status: { in: ["DELIVERED", "CANCELED"] },
      createdAt: { lt: cutoff },
      // não reprocessa quem já foi anonimizado
      customerName: { not: "Cliente removido (LGPD)" },
    },
    data: {
      customerName: "Cliente removido (LGPD)",
      customerPhone: "000000000",
      street: null,
      number: null,
      complement: null,
      neighborhood: null,
      city: null,
      zipCode: null,
      referenceNote: null,
    },
  });

  console.log(`${result.count} pedido(s) anonimizado(s) (mais de ${RETENTION_DAYS} dias).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());