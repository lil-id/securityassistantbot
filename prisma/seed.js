const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {

    const adminAccount = await prisma.admins.createMany({
        data: [
          {
            name: 'Holil',
            numberPhone: '6282293675164@c.us',
            role: 'admin',
          }
        ],
        skipDuplicates: true,
    });

    const userAccount = await prisma.users.createMany({
      data: [
        {
          name: 'Holil',
          numberPhone: '6282293675164@c.us',
          role: 'user',
        }
      ],
      skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });