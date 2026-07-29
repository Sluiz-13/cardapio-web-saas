import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const restaurant = await db.restaurant.upsert({
    where: { slug: "quiosque-to-em-casa" },
    update: {},
    create: {
      name: "Quiosque Tô Em Casa",
      slug: "quiosque-to-em-casa",
      isOpen: true,
    },
  });

  const passwordHash = await bcrypt.hash("quiosque", 10);

  await db.adminUser.upsert({
    where: { email: "admin@quiosque.com" },
    update: {},
    create: {
      restaurantId: restaurant.id,
      name: "Admin",
      email: "admin@quiosque.com",
      passwordHash,
      role: "OWNER",
    },
  });

  console.log("Seed concluído.");
  console.log("Login admin -> admin@quiosque.com / troque-esta-senha");
  console.log("!! Troque essa senha assim que logar pela primeira vez !!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
