import 'server-only';

import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const dbUrl = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined;
  
  // If DATABASE_URL is missing or empty (mock mode), pass a dummy accelerateUrl.
  // This satisfies Prisma 7's constructor options and prevents initialization crashes.
  if (!dbUrl || dbUrl.trim() === '') {
    return new PrismaClient({
      accelerateUrl: "prisma://accelerate.placeholder.com"
    });
  }

  // Client-side guard: do not instantiate pg/PrismaPg in the browser
  if (typeof window !== 'undefined') {
    return new PrismaClient({
      accelerateUrl: "prisma://accelerate.placeholder.com"
    });
  }
  
  // Load server-only dependencies dynamically using eval('require') so Webpack ignores them during client compilation
  const { PrismaPg } = eval('require')('@prisma/adapter-pg');
  const { Pool } = eval('require')('pg');
  
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
