import { PrismaClient } from '../../node_modules/.prisma/client-media';

// Singleton pattern for Prisma Client
// Prevents multiple instances in development with hot reload

declare global {
  var prisma: PrismaClient | undefined;
}

console.log('[PRISMA] Initializing Prisma Client...');

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

console.log('[PRISMA] Prisma Client initialized:', !!prisma);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
