import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({ where: { isActive: true } });
  console.log(companies.map(c => c.ticker));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
