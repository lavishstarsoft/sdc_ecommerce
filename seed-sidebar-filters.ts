import prisma from './lib/prisma';

async function main() {
  const filters = [
    {
      filterType: 'BRAND',
      label: 'Brand',
      config: { options: ['Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Saidurga Premium'] },
      isEnabled: true,
      displayOrder: 1,
    },
    {
      filterType: 'WARRANTY',
      label: 'Warranty',
      config: { options: ['1 Year', '2 Years', '3 Years', 'No Warranty'] },
      isEnabled: true,
      displayOrder: 2,
    },
    {
      filterType: 'PRICE_RANGE',
      label: 'Price',
      config: { min: 0, max: 200000, step: 1000 },
      isEnabled: true,
      displayOrder: 3,
    },
    {
      filterType: 'DELIVERY',
      label: 'Delivery Options',
      config: { options: ['Free Delivery', 'Next Day Delivery', 'Standard'] },
      isEnabled: true,
      displayOrder: 4,
    },
    {
      filterType: 'SORT',
      label: 'Sort By',
      config: { options: ['Price: Low to High', 'Price: High to Low', 'Newest Arrivals', 'Best Sellers'] },
      isEnabled: true,
      displayOrder: 5,
    }
  ];

  for (const filter of filters) {
    await prisma.sidebarFilter.create({
      data: filter,
    });
  }

  console.log('Successfully seeded SidebarFilters');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
