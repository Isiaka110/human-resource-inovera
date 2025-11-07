// lib/prisma.ts

import { PrismaClient } from '@prisma/client';

// 1. Extend the Node.js global type to include the Prisma client
// This is necessary to persist the client across Next.js's hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 2. Initialize the Prisma Client: use the global instance if it exists, otherwise create a new one.
// We are using 'global.prisma' which Next.js preserves between reloads.
const prisma = global.prisma || new PrismaClient({
  // Optionally, you can log all queries in development for debugging
  // log: ['query', 'info', 'warn', 'error'],
});

// 3. In the development environment, save the instance to the global variable
// We skip this in production because the process environment is not reused.
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// 4. Export the single, shared client instance
export default prisma;