const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET dashboard statistics
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, categoryId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build where clauses
    const productWhere = {};
    const receiptWhere = {};
    const deliveryWhere = {};

    if (warehouseId) {
      receiptWhere.warehouseId = parseInt(warehouseId);
      deliveryWhere.warehouseId = parseInt(warehouseId);
    }

    if (categoryId) {
      productWhere.categoryId = parseInt(categoryId);
    }

    // Total Products in Stock
    const totalProducts = await prisma.product.count({
      where: {
        ...productWhere,
        isActive: true
      }
    });

    // Low Stock / Out of Stock Items
    const productsWithStock = await prisma.product.findMany({
      where: {
        ...productWhere,
        isActive: true
      },
      include: {
        stocks: warehouseId ? {
          where: {
            warehouseId: parseInt(warehouseId)
          }
        } : true
      }
    });

    const lowStockItems = productsWithStock.filter(product => {
      const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      return totalStock > 0 && totalStock <= product.minStock;
    });

    const outOfStockItems = productsWithStock.filter(product => {
      const totalStock = product.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      return totalStock === 0;
    });

    // Pending Receipts (DRAFT or READY status)
    const pendingReceipts = await prisma.receipt.count({
      where: {
        ...receiptWhere,
        status: {
          in: ['DRAFT', 'READY']
        }
      }
    });

    // Receipts to receive (scheduled date >= today)
    const receiptsToReceive = await prisma.receipt.count({
      where: {
        ...receiptWhere,
        status: {
          in: ['DRAFT', 'READY']
        },
        scheduledDate: {
          gte: today
        }
      }
    });

    // Late receipts (scheduled date < today and status is DRAFT or READY)
    const lateReceipts = await prisma.receipt.count({
      where: {
        ...receiptWhere,
        status: {
          in: ['DRAFT', 'READY']
        },
        scheduledDate: {
          lt: today
        }
      }
    });

    // Receipts operations (scheduled date > today)
    const receiptOperations = await prisma.receipt.count({
      where: {
        ...receiptWhere,
        status: {
          in: ['DRAFT', 'READY']
        },
        scheduledDate: {
          gt: today
        }
      }
    });

    // Pending Deliveries (DRAFT, WAITING, or READY status)
    const pendingDeliveries = await prisma.delivery.count({
      where: {
        ...deliveryWhere,
        status: {
          in: ['DRAFT', 'WAITING', 'READY']
        }
      }
    });

    // Deliveries to deliver (scheduled date >= today)
    const deliveriesToDeliver = await prisma.delivery.count({
      where: {
        ...deliveryWhere,
        status: {
          in: ['DRAFT', 'WAITING', 'READY']
        },
        scheduledDate: {
          gte: today
        }
      }
    });

    // Late deliveries
    const lateDeliveries = await prisma.delivery.count({
      where: {
        ...deliveryWhere,
        status: {
          in: ['DRAFT', 'WAITING', 'READY']
        },
        scheduledDate: {
          lt: today
        }
      }
    });

    // Waiting deliveries
    const waitingDeliveries = await prisma.delivery.count({
      where: {
        ...deliveryWhere,
        status: 'WAITING'
      }
    });

    // Delivery operations
    const deliveryOperations = await prisma.delivery.count({
      where: {
        ...deliveryWhere,
        status: {
          in: ['DRAFT', 'WAITING', 'READY']
        },
        scheduledDate: {
          gt: today
        }
      }
    });

    // Internal Transfers Scheduled
    const scheduledTransfers = await prisma.transfer.count({
      where: {
        status: {
          in: ['DRAFT', 'READY']
        },
        scheduledDate: {
          gte: today
        }
      }
    });

    res.json({
      totalProducts,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems: lowStockItems.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        minStock: p.minStock,
        currentStock: p.stocks.reduce((sum, s) => sum + s.quantity, 0)
      })),
      outOfStockItems: outOfStockItems.map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock: 0
      })),
      pendingReceipts,
      receipts: {
        toReceive: receiptsToReceive,
        late: lateReceipts,
        operations: receiptOperations
      },
      pendingDeliveries,
      deliveries: {
        toDeliver: deliveriesToDeliver,
        late: lateDeliveries,
        waiting: waitingDeliveries,
        operations: deliveryOperations
      },
      scheduledTransfers
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

module.exports = router;
