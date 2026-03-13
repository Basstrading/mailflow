// @ts-expect-error - seed runs outside of Next.js, path alias not available
import { PrismaClient } from "../lib/generated/prisma/index.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.log("ADMIN_EMAIL and ADMIN_PASSWORD env vars required for seeding.");
    console.log("Skipping admin user creation.");
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user ${email} already exists.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log(`Admin user ${email} created successfully.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
