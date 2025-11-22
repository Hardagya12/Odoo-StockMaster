const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Start seeding...');

  // 1. Create Users
  const password = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@stockmaster.in' },
    update: {},
    create: {
      email: 'admin@stockmaster.in',
      name: 'Admin User',
      password,
    },
  });
  console.log(`Created user: ${user.email}`);

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

  // 3. Create Locations for each warehouse
  const locations = [];
  for (const warehouse of warehouses) {
    const locs = [
      { name: 'Stock', code: `WH/${warehouse.code.split('-')[1]}/STOCK`, type: 'ZONE' },
      { name: 'Input', code: `WH/${warehouse.code.split('-')[1]}/INPUT`, type: 'ZONE' },
      { name: 'Output', code: `WH/${warehouse.code.split('-')[1]}/OUTPUT`, type: 'ZONE' },
    ];

    for (const l of locs) {
      const location = await prisma.location.upsert({
        where: { code: l.code },
        update: {},
        create: {
          ...l,
          warehouseId: warehouse.id,
        },
      });
      locations.push(location);
      console.log(`Created location: ${location.name} in ${warehouse.name}`);
    }
  }
  
  // Add a Vendor Location
  const vendorLocation = await prisma.location.upsert({
      where: { code: 'PARTNER/VENDORS' },
      update: {},
      create: {
          name: 'Vendors',
          code: 'PARTNER/VENDORS',
          warehouseId: warehouses[0].id, // Associate with first warehouse for simplicity, or create a virtual one
          type: 'VENDOR'
      }
  });

  // Add a Customer Location
  const customerLocation = await prisma.location.upsert({
      where: { code: 'PARTNER/CUSTOMERS' },
      update: {},
      create: {
          name: 'Customers',
          code: 'PARTNER/CUSTOMERS',
          warehouseId: warehouses[0].id,
          type: 'CUSTOMER'
      }
  });


  // 4. Create Categories
  const categoriesData = [
    { name: 'Electronics', description: 'Gadgets and devices' },
    { name: 'Groceries', description: 'Daily essentials' },
    { name: 'Clothing', description: 'Apparel and fashion' },
  ];

  const categories = [];
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    categories.push(category);
    console.log(`Created category: ${category.name}`);
  }

  // 5. Create Products (Indian Context)
  const productsData = [
    { sku: 'ELEC-001', name: 'Redmi Note 13 Pro', categoryId: categories[0].id, unitOfMeasure: 'pcs', unitPrice: 18999, minStock: 10 },
    { sku: 'ELEC-002', name: 'boAt Rockerz 450', categoryId: categories[0].id, unitOfMeasure: 'pcs', unitPrice: 1499, minStock: 20 },
    { sku: 'GROC-001', name: 'Amul Butter 500g', categoryId: categories[1].id, unitOfMeasure: 'pcs', unitPrice: 275, minStock: 50 },
    { sku: 'GROC-002', name: 'Tata Salt 1kg', categoryId: categories[1].id, unitOfMeasure: 'pcs', unitPrice: 28, minStock: 100 },
    { sku: 'GROC-003', name: 'India Gate Basmati Rice 5kg', categoryId: categories[1].id, unitOfMeasure: 'pcs', unitPrice: 850, minStock: 30 },
    { sku: 'CLOTH-001', name: 'FabIndia Cotton Kurta', categoryId: categories[2].id, unitOfMeasure: 'pcs', unitPrice: 1299, minStock: 15 },
    { sku: 'CLOTH-002', name: 'Raymond Formal Shirt', categoryId: categories[2].id, unitOfMeasure: 'pcs', unitPrice: 2499, minStock: 10 },
  ];

  const products = [];
  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
    products.push(product);
    console.log(`Created product: ${product.name}`);
  }

  // 6. Create Initial Stock (in Stock locations)
  // Filter for 'Stock' locations
  const stockLocations = locations.filter(l => l.name === 'Stock');

  for (const product of products) {
    // Randomly assign stock to warehouses
    for (const loc of stockLocations) {
      if (Math.random() > 0.3) { // 70% chance to have stock
        const qty = Math.floor(Math.random() * 100) + 10;
        await prisma.stock.upsert({
          where: {
            productId_locationId_warehouseId: {
              productId: product.id,
              locationId: loc.id,
              warehouseId: loc.warehouseId,
            }
          },
          update: { quantity: qty },
          create: {
            productId: product.id,
            locationId: loc.id,
            warehouseId: loc.warehouseId,
            quantity: qty,
          },
        });
        console.log(`Added ${qty} ${product.unitOfMeasure} of ${product.name} to ${loc.code}`);
      }
    }
  }

  // 7. Create Receipts (Incoming Shipments)
  // Some done, some waiting, some late
  const suppliers = ['Reliance Retail', 'D-Mart Suppliers', 'Local Mandi Traders', 'Cloudtail India'];
  
  for (let i = 0; i < 10; i++) {
    const status = i < 4 ? 'DONE' : (i < 7 ? 'READY' : 'DRAFT'); // 4 done, 3 ready (to receive), 3 draft
    const isLate = i === 5 || i === 6; // Make some ready ones late
    const scheduledDate = isLate ? new Date(Date.now() - 86400000 * 2) : new Date(Date.now() + 86400000 * 5); // Late: 2 days ago, Future: 5 days later
    
    const warehouse = warehouses[i % warehouses.length];
    const receipt = await prisma.receipt.create({
      data: {
        reference: `WH/IN/${String(i + 1000).padStart(5, '0')}`,
        warehouseId: warehouse.id,
        sourceDoc: `PO-${String(i + 500).padStart(5, '0')}`,
        supplier: suppliers[i % suppliers.length],
        status: status === 'READY' && isLate ? 'READY' : status, // Status enum matches
        scheduledDate: scheduledDate,
      }
    });

    // Add moves to receipt
    const product = products[i % products.length];
    await prisma.stockMove.create({
      data: {
        productId: product.id,
        quantity: Math.floor(Math.random() * 50) + 10,
        type: 'INCOMING',
        status: status,
        receiptId: receipt.id,
        sourceLocationId: vendorLocation.id,
        destinationLocationId: locations.find(l => l.warehouseId === warehouse.id && l.name === 'Stock').id,
      }
    });
    console.log(`Created Receipt ${receipt.reference} (${status})`);
  }

  // 8. Create Deliveries (Outgoing Shipments)
  const customers = ['Ramesh Kumar', 'Priya Sharma', 'Tech Solutions Pvt Ltd', 'Big Bazaar'];

  for (let i = 0; i < 10; i++) {
    const status = i < 3 ? 'DONE' : (i < 6 ? 'WAITING' : 'READY'); // 3 done, 3 waiting, 4 ready
    const isLate = i === 7;
    const scheduledDate = isLate ? new Date(Date.now() - 86400000 * 1) : new Date(Date.now() + 86400000 * 3);

    const warehouse = warehouses[i % warehouses.length];
    const delivery = await prisma.delivery.create({
      data: {
        reference: `WH/OUT/${String(i + 1000).padStart(5, '0')}`,
        warehouseId: warehouse.id,
        sourceDoc: `SO-${String(i + 500).padStart(5, '0')}`,
        customer: customers[i % customers.length],
        status: status,
        scheduledDate: scheduledDate,
      }
    });

    const product = products[(i + 2) % products.length];
    await prisma.stockMove.create({
      data: {
        productId: product.id,
        quantity: Math.floor(Math.random() * 20) + 1,
        type: 'OUTGOING',
        status: status,
        deliveryId: delivery.id,
        sourceLocationId: locations.find(l => l.warehouseId === warehouse.id && l.name === 'Stock').id,
        destinationLocationId: customerLocation.id,
      }
    });
    console.log(`Created Delivery ${delivery.reference} (${status})`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
