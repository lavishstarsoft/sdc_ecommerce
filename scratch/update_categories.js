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
  console.log("Starting Category database update...");

  // 1. Ensure "Laptops" category exists
  let laptopsCat = await prisma.category.findUnique({
    where: { name: "Laptops" }
  });
  if (!laptopsCat) {
    laptopsCat = await prisma.category.create({
      data: {
        name: "Laptops",
        showInMenu: true,
        displayOrder: 1
      }
    });
    console.log("Created category: Laptops");
  } else {
    await prisma.category.update({
      where: { id: laptopsCat.id },
      data: { showInMenu: true, displayOrder: 1 }
    });
    console.log("Updated category: Laptops (showInMenu: true)");
  }

  // 2. Update other categories display orders and menu visibility
  const categoryUpdates = [
    { name: "Component Parts", order: 2 },
    { name: "Hot Accessories", order: 3 },
    { name: "Printers & CCTV", order: 4 },
    { name: "Quick Service Desk", order: 5 }
  ];

  for (const cat of categoryUpdates) {
    const dbCat = await prisma.category.findUnique({ where: { name: cat.name } });
    if (dbCat) {
      await prisma.category.update({
        where: { id: dbCat.id },
        data: {
          showInMenu: true,
          displayOrder: cat.order
        }
      });
      console.log(`Updated category: ${cat.name} (showInMenu: true, order: ${cat.order})`);
    } else {
      await prisma.category.create({
        data: {
          name: cat.name,
          showInMenu: true,
          displayOrder: cat.order
        }
      });
      console.log(`Created category: ${cat.name}`);
    }
  }

  // 3. Update existing products' category values
  const products = await prisma.product.findMany();
  for (const prod of products) {
    let newCategory = prod.category;
    if (prod.category === "Laptops") {
      newCategory = "Laptops";
    } else if (prod.category === "PC Build") {
      newCategory = "Component Parts";
    } else if (prod.category === "Accessories") {
      newCategory = "Hot Accessories";
    } else if (prod.category === "CCTV" || prod.category === "Laser Printers" || prod.category === "Ink & Toner") {
      newCategory = "Printers & CCTV";
    }

    if (newCategory !== prod.category) {
      await prisma.product.update({
        where: { id: prod.id },
        data: { category: newCategory }
      });
      console.log(`Updated product category: "${prod.title}" -> "${newCategory}"`);
    }
  }

  // 4. Update category grids links
  const grids = await prisma.categoryGrid.findMany();
  for (const grid of grids) {
    let itemsCopy = typeof grid.items === 'string' ? JSON.parse(grid.items) : grid.items;
    let modified = false;

    if (Array.isArray(itemsCopy)) {
      itemsCopy = itemsCopy.map(item => {
        let newLink = item.link;
        if (item.link === "Laptops") {
          newLink = "Laptops";
        } else if (item.link === "PC Build" || item.link === "Computer Parts") {
          newLink = "Component Parts";
        } else if (item.link === "Accessories") {
          newLink = "Hot Accessories";
        } else if (item.link === "CCTV" || item.link === "Laser Printers" || item.link === "Ink & Toner" || item.link === "Printers") {
          newLink = "Printers & CCTV";
        }

        if (newLink !== item.link) {
          modified = true;
          return { ...item, link: newLink };
        }
        return item;
      });
    }

    if (modified) {
      await prisma.categoryGrid.update({
        where: { id: grid.id },
        data: { items: itemsCopy }
      });
      console.log(`Updated category grid items for: "${grid.title}"`);
    }
  }

  console.log("Database update completed successfully.");
  await pool.end();
}

run().catch(async (e) => {
  console.error(e);
  await pool.end();
});
