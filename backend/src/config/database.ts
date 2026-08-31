import { PrismaClient } from '@prisma/client';
import { getEnv } from './env';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: getEnv().NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  console.log('✅ Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
}