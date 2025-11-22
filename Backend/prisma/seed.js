const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Start seeding...');

  // 1. Create Users
  // Only create if doesn't exist. If exists, DO NOT update password.
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@stockmaster.in' },
    update: {
      password: password, // FORCE UPDATE PASSWORD
    },
    create: {
      email: 'admin@stockmaster.in',
      name: 'Admin User',
      password,
    },
  });
  console.log(`Checked/Created user: ${user.email}`);

  /* 
  // DUMMY DATA GENERATION - COMMENTED OUT FOR PRODUCTION
  // Uncomment this block if you want to seed dummy data in development

  // 2. Create Warehouses (Indian Context)
  const warehousesData = [
    { name: 'Mumbai Central Warehouse', code: 'WH-MUM-001', address: 'Andheri East, Mumbai, Maharashtra' },
    { name: 'Delhi Distribution Center', code: 'WH-DEL-001', address: 'Okhla Industrial Area, New Delhi' },
    { name: 'Bangalore Tech Hub Storage', code: 'WH-BLR-001', address: 'Whitefield, Bangalore, Karnataka' },
  ];

  const warehouses = [];
  for (const w of warehousesData) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code: w.code },
      update: {},
      create: w,
    });
    warehouses.push(warehouse);
    console.log(`Created warehouse: ${warehouse.name}`);
  }

  // ... (Rest of the dummy data logic would go here if uncommented)
  */
  
  console.log('Seeding finished (Admin user only).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
