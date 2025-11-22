const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate receipt reference: WW/IN/YYYY/ID
async function generateReceiptReference(warehouseCode) {
  const year = new Date().getFullYear();
  const count = await prisma.receipt.count({
    where: {
      reference: {
        startsWith: `${warehouseCode}/IN/${year}/`
      }
    }
  });
  const id = String(count + 1).padStart(4, '0');
  return `${warehouseCode}/IN/${year}/${id}`;
}

// GET all receipts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, status, search } = req.query;
    const where = {};

    if (warehouseId) {
      where.warehouseId = parseInt(warehouseId);
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { supplier: { contains: search, mode: 'insensitive' } },
        { sourceDoc: { contains: search, mode: 'insensitive' } }
      ];
    }

    const receipts = await prisma.receipt.findMany({
      where,
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            destinationLocation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ message: 'Error fetching receipts' });
  }
});

// GET single receipt
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: {
              include: {
                category: true
              }
            },
            destinationLocation: true
          }
        }
      }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({ message: 'Error fetching receipt' });
  }
});

// POST create receipt
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, supplier, sourceDoc, scheduledDate, items } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ message: 'Warehouse ID is required' });
    }

    // Validate warehouse
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    });

    if (!warehouse) {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }

    // Generate reference
    const reference = await generateReceiptReference(warehouse.code);

    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        reference,
        warehouseId: parseInt(warehouseId),
        supplier: supplier || null,
        sourceDoc: sourceDoc || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'DRAFT',
        stockMoves: items && items.length > 0 ? {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            destinationLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity),
            type: 'INCOMING',
            status: 'DRAFT'
          }))
        } : undefined
      },
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            destinationLocation: true
          }
        }
      }
    });

    res.status(201).json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    res.status(500).json({ message: 'Error creating receipt' });
  }
});

// PUT update receipt
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier, sourceDoc, scheduledDate, items, status } = req.body;

    const existingReceipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: { stockMoves: true }
    });

    if (!existingReceipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // Can't update if already DONE
    if (existingReceipt.status === 'DONE') {
      return res.status(400).json({ message: 'Cannot update completed receipt' });
    }

    // Update receipt
    const receipt = await prisma.receipt.update({
      where: { id: parseInt(id) },
      data: {
        supplier: supplier !== undefined ? supplier : existingReceipt.supplier,
        sourceDoc: sourceDoc !== undefined ? sourceDoc : existingReceipt.sourceDoc,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingReceipt.scheduledDate,
        status: status || existingReceipt.status
      },
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            destinationLocation: true
          }
        }
      }
    });

    // Update items if provided
    if (items) {
      // Delete existing moves
      await prisma.stockMove.deleteMany({
        where: { receiptId: parseInt(id) }
      });

      // Create new moves
      if (items.length > 0) {
        await prisma.stockMove.createMany({
          data: items.map(item => ({
            receiptId: parseInt(id),
            productId: parseInt(item.productId),
            destinationLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity),
            type: 'INCOMING',
            status: receipt.status
          }))
        });
      }

      // Reload receipt with updated moves
      const updatedReceipt = await prisma.receipt.findUnique({
        where: { id: parseInt(id) },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              destinationLocation: true
            }
          }
        }
      });
      return res.json(updatedReceipt);
    }

    res.json(receipt);
  } catch (error) {
    console.error('Error updating receipt:', error);
    res.status(500).json({ message: 'Error updating receipt' });
  }
});

// POST validate receipt (Draft -> Ready -> Done)
router.post('/:id/validate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) },
      include: {
        stockMoves: {
          include: {
            product: true,
            destinationLocation: true
          }
        },
        warehouse: true
      }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    if (receipt.status === 'DONE') {
      return res.status(400).json({ message: 'Receipt is already completed' });
    }

    if (receipt.status === 'DRAFT') {
      // Move to READY
      const updatedReceipt = await prisma.receipt.update({
        where: { id: parseInt(id) },
        data: { status: 'READY' },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              destinationLocation: true
            }
          }
        }
      });
      return res.json(updatedReceipt);
    }

    if (receipt.status === 'READY') {
      // Move to DONE and update stock
      if (!receipt.stockMoves || receipt.stockMoves.length === 0) {
        return res.status(400).json({ message: 'Receipt has no items' });
      }

      // Update stock for each move
      for (const move of receipt.stockMoves) {
        if (!move.destinationLocationId) {
          return res.status(400).json({ 
            message: `Product ${move.product.name} has no destination location` 
          });
        }

        // Find or create stock record
        let stock = await prisma.stock.findFirst({
          where: {
            productId: move.productId,
            locationId: move.destinationLocationId,
            warehouseId: receipt.warehouseId
          }
        });

        if (stock) {
          // Update existing stock
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              quantity: stock.quantity + move.quantity
            }
          });
        } else {
          // Create new stock record
          await prisma.stock.create({
            data: {
              productId: move.productId,
              locationId: move.destinationLocationId,
              warehouseId: receipt.warehouseId,
              quantity: move.quantity,
              reserved: 0
            }
          });
        }

        // Update move status
        await prisma.stockMove.update({
          where: { id: move.id },
          data: { status: 'DONE' }
        });
      }

      // Update receipt status
      const updatedReceipt = await prisma.receipt.update({
        where: { id: parseInt(id) },
        data: { status: 'DONE' },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              destinationLocation: true
            }
          }
        }
      });

      return res.json(updatedReceipt);
    }

    res.status(400).json({ message: 'Invalid receipt status for validation' });
  } catch (error) {
    console.error('Error validating receipt:', error);
    res.status(500).json({ message: 'Error validating receipt' });
  }
});

// DELETE receipt
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { id: parseInt(id) }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    if (receipt.status === 'DONE') {
      return res.status(400).json({ 
        message: 'Cannot delete completed receipt' 
      });
    }

    // Delete associated stock moves
    await prisma.stockMove.deleteMany({
      where: { receiptId: parseInt(id) }
    });

    // Delete receipt
    await prisma.receipt.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    res.status(500).json({ message: 'Error deleting receipt' });
  }
});

module.exports = router;
