const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all stock moves (for move history)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { 
      type, 
      status, 
      warehouseId,
      productId,
      reference,
      contact,
      fromDate,
      toDate
    } = req.query;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (reference) {
      where.reference = { contains: reference, mode: 'insensitive' };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        where.createdAt.lte = new Date(toDate);
      }
    }

    const stockMoves = await prisma.stockMove.findMany({
      where,
      include: {
        product: {
          include: {
            category: true
          }
        },
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        },
        receipt: {
          include: { warehouse: true }
        },
        delivery: {
          include: { warehouse: true }
        },
        transfer: true,
        adjustment: {
          include: { warehouse: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter by contact if provided (searches in receipt supplier, delivery customer)
    let filteredMoves = stockMoves;
    if (contact) {
      filteredMoves = stockMoves.filter(move => {
        if (move.receipt && move.receipt.supplier) {
          return move.receipt.supplier.toLowerCase().includes(contact.toLowerCase());
        }
        if (move.delivery && move.delivery.customer) {
          return move.delivery.customer.toLowerCase().includes(contact.toLowerCase());
        }
        return false;
      });
    }

    // Filter by warehouse if provided
    if (warehouseId) {
      filteredMoves = filteredMoves.filter(move => {
        if (move.receipt && move.receipt.warehouseId === parseInt(warehouseId)) return true;
        if (move.delivery && move.delivery.warehouseId === parseInt(warehouseId)) return true;
        if (move.adjustment && move.adjustment.warehouseId === parseInt(warehouseId)) return true;
        if (move.sourceLocation && move.sourceLocation.warehouseId === parseInt(warehouseId)) return true;
        if (move.destinationLocation && move.destinationLocation.warehouseId === parseInt(warehouseId)) return true;
        return false;
      });
    }

    res.json(filteredMoves);
  } catch (error) {
    console.error('Error fetching stock moves:', error);
    res.status(500).json({ message: 'Error fetching stock moves' });
  }
});

// GET single stock move
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const stockMove = await prisma.stockMove.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: {
          include: {
            category: true
          }
        },
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        },
        receipt: {
          include: { warehouse: true }
        },
        delivery: {
          include: { warehouse: true }
        },
        transfer: {
          include: {
            sourceLocation: { include: { warehouse: true } },
            destinationLocation: { include: { warehouse: true } }
          }
        },
        adjustment: {
          include: { warehouse: true }
        }
      }
    });

    if (!stockMove) {
      return res.status(404).json({ message: 'Stock move not found' });
    }

    res.json(stockMove);
  } catch (error) {
    console.error('Error fetching stock move:', error);
    res.status(500).json({ message: 'Error fetching stock move' });
  }
});

module.exports = router;
