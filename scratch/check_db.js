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
  const products = await prisma.product.findMany();
  console.log("PRODUCTS:", JSON.stringify(products.map(p => ({ id: p.id, title: p.title, category: p.category })), null, 2));
  
  const categories = await prisma.category.findMany();
  console.log("CATEGORIES:", JSON.stringify(categories.map(c => ({ id: c.id, name: c.name })), null, 2));

  const categoryGrids = await prisma.categoryGrid.findMany();
  console.log("CATEGORY GRIDS:", JSON.stringify(categoryGrids, null, 2));

  await pool.end();
}
run();
