import "dotenv/config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

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
