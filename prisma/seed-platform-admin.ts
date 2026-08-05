import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_PLATFORM_ADMIN_EMAIL ?? "admin@quiosque.com";
  const password = process.env.SEED_PLATFORM_ADMIN_PASSWORD ?? "quiosque";
  const name = process.env.SEED_PLATFORM_ADMIN_NAME ?? "Admin Plataforma";

  const passwordHash = await bcrypt.hash(password, 10);

  await db.platformAdmin.upsert({
    where: { email },
    update: {},
    create: { name, email, passwordHash },
  });

  console.log("Seed de PlatformAdmin concluído.");
  console.log(`Login plataforma -> ${email} / ${password}`);
  console.log("!! Troque essa senha assim que logar pela primeira vez !!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());