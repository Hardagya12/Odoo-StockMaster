// prisma/seed.js
require("dotenv").config(); // load .env
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Optional: wipe existing demo data
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.location.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.category.deleteMany();

  // ---- Warehouse -------------------------------------------------
  const warehouse = await prisma.warehouse.create({
    data: {
      name: "Main Warehouse",
      code: "WH01",
      address: "123 Stock St, City",
      capacity: 1000,
      isActive: true,
    },
  });

  // ---- Location --------------------------------------------------
  const location = await prisma.location.create({
    data: {
      name: "Aisle 1",
      code: "LOC01",
      type: "ZONE",
      warehouseId: warehouse.id,
    },
  });

  // ---- Product ---------------------------------------------------
  const product = await prisma.product.create({
    data: {
      sku: "PROD001",
      name: "Sample Widget",
      description: "A demo product for testing",
      unitOfMeasure: "pcs",
      unitPrice: 9.99,
      minStock: 5,
      isActive: true,
    },
  });

  // ---- Stock ------------------------------------------------------
  await prisma.stock.create({
    data: {
      productId: product.id,
      locationId: location.id,
      warehouseId: warehouse.id,
      quantity: 100,
      reserved: 0,
    },
  });

  console.log("✅ Seed data created");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
