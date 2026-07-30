import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const restaurant = await db.restaurant.findUnique({ where: { slug: "quiosque-to-em-casa" } });
  if (!restaurant) {
    console.error("Restaurante não encontrado. Rode o seed principal primeiro.");
    process.exit(1);
  }

  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek++) {
    await db.businessHours.upsert({
      where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek } },
      update: {},
      create: {
        restaurantId: restaurant.id,
        dayOfWeek,
        isOpen: dayOfWeek !== 0, // fechado domingo por padrão, ajusta depois na tela
        openTime: "11:00",
        closeTime: "22:00",
      },
    });
  }

  console.log("Horários de funcionamento criados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => db.$disconnect());