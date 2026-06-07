import 'server-only';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl || dbUrl.trim() === '') {
    return new PrismaClient({
      accelerateUrl: 'prisma://accelerate.placeholder.com',
    });
  }

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const hasSslMode = dbUrl.includes('sslmode=');

  const pool = new Pool({
    connectionString: dbUrl,
    max: 1,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 20_000,
    ...(!isLocal && !hasSslMode ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (!globalThis.prisma) {
  globalThis.prisma = prisma;
}
