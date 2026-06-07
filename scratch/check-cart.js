const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const dbUrl = "postgresql://postgres.mhwltetdyazixrhcbpds:ashokca810%40A@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Fetching wishlist items...");
  const wishlistItems = await prisma.wishlistItem.findMany();
  console.log("Wishlist items:", JSON.stringify(wishlistItems, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
