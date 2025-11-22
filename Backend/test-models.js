require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Testing database connection and new models...');

  try {
    // Check if we can access the new models
    // If the client wasn't regenerated properly, these properties might be undefined

    if (!prisma.receipt) throw new Error('Receipt model not found on Prisma Client');
    const receiptCount = await prisma.receipt.count();
    console.log(`Receipts count: ${receiptCount}`);

    if (!prisma.delivery) throw new Error('Delivery model not found on Prisma Client');
    const deliveryCount = await prisma.delivery.count();
    console.log(`Deliveries count: ${deliveryCount}`);

    if (!prisma.transfer) throw new Error('Transfer model not found on Prisma Client');
    const transferCount = await prisma.transfer.count();
    console.log(`Transfers count: ${transferCount}`);

    if (!prisma.adjustment) throw new Error('Adjustment model not found on Prisma Client');
    const adjustmentCount = await prisma.adjustment.count();
    console.log(`Adjustments count: ${adjustmentCount}`);

    if (!prisma.stockMove) throw new Error('StockMove model not found on Prisma Client');
    const moveCount = await prisma.stockMove.count();
    console.log(`StockMoves count: ${moveCount}`);

    console.log('✅ All new models are accessible.');
  } catch (error) {
    console.error('❌ Error accessing models:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
