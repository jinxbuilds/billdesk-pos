import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  const restaurant = await prisma.restaurant.create({
    data: {
      name: "Demo Cafe",
      staff: {
        create: {
          name: "Owner",
          role: "OWNER",
          pinHash,
        },
      },
      settings: {
        create: {},
      },
    },
  });

  console.log("Restaurant ID:", restaurant.id);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });