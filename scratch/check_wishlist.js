const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Read .env.local
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
const dbUrlMatch = envFile.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
if (!dbUrlMatch) {
  console.error("DATABASE_URL not found");
  process.exit(1);
}
const dbUrl = dbUrlMatch[1];
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    console.log("Checking products...");
    const products = await prisma.product.findMany({ take: 1 });
    console.log("Product found:", products.length > 0 ? products[0].id : "None");

    console.log("Checking users...");
    const users = await prisma.user.findMany({ take: 1 });
    console.log("User found:", users.length > 0 ? users[0].id : "None");

    if (products.length > 0 && users.length > 0) {
      const userId = users[0].id;
      const productId = products[0].id;

      console.log(`Checking wishlist query findUnique for user: ${userId}, product: ${productId}...`);
      const existing = await prisma.wishlistItem.findUnique({
        where: {
          userId_productId: { userId, productId }
        }
      });
      console.log("Existing item query success:", existing !== undefined);
      
      console.log("Checking findMany...");
      const allItems = await prisma.wishlistItem.findMany({
        where: { userId }
      });
      console.log("All items count:", allItems.length);
    } else {
      console.log("Cannot run full test because user or product list is empty.");
    }
  } catch (err) {
    console.error("DB Query Error:", err);
  } finally {
    await pool.end();
  }
}
run();
