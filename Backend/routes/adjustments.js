const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate adjustment reference: ADJ/YYYY/ID
async function generateAdjustmentReference() {
  const year = new Date().getFullYear();
  const count = await prisma.adjustment.count({
    where: {
      reference: {
        startsWith: `ADJ/${year}/`
      }
    }
  });
  const id = String(count + 1).padStart(4, '0');
  return `ADJ/${year}/${id}`;
}

// GET all adjustments
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
        { reason: { contains: search, mode: 'insensitive' } }
      ];
    }

    const adjustments = await prisma.adjustment.findMany({
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
    res.json(adjustments);
  } catch (error) {
    console.error('Error fetching adjustments:', error);
    res.status(500).json({ message: 'Error fetching adjustments' });
  }
});

// GET single adjustment
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await prisma.adjustment.findUnique({
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

    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }

    res.json(adjustment);
  } catch (error) {
    console.error('Error fetching adjustment:', error);
    res.status(500).json({ message: 'Error fetching adjustment' });
  }
});

// POST create adjustment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, reason, date, items } = req.body;

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
    const reference = await generateAdjustmentReference();

    // Create adjustment
    const adjustment = await prisma.adjustment.create({
      data: {
        reference,
        warehouseId: parseInt(warehouseId),
        reason: reason || null,
        date: date ? new Date(date) : new Date(),
        status: 'DRAFT',
        stockMoves: items && items.length > 0 ? {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            destinationLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity), // This is the new quantity (adjustment amount)
            type: 'ADJUSTMENT',
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

    res.status(201).json(adjustment);
  } catch (error) {
    console.error('Error creating adjustment:', error);
    res.status(500).json({ message: 'Error creating adjustment' });
  }
});

// PUT update adjustment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, date, items, status } = req.body;

    const existingAdjustment = await prisma.adjustment.findUnique({
      where: { id: parseInt(id) },
      include: { stockMoves: true }
    });

    if (!existingAdjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }

    // Can't update if already DONE
    if (existingAdjustment.status === 'DONE') {
      return res.status(400).json({ message: 'Cannot update completed adjustment' });
    }

    // Update adjustment
    const adjustment = await prisma.adjustment.update({
      where: { id: parseInt(id) },
      data: {
        reason: reason !== undefined ? reason : existingAdjustment.reason,
        date: date ? new Date(date) : existingAdjustment.date,
        status: status || existingAdjustment.status
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
        where: { adjustmentId: parseInt(id) }
      });

      // Create new moves
      if (items.length > 0) {
        await prisma.stockMove.createMany({
          data: items.map(item => ({
            adjustmentId: parseInt(id),
            productId: parseInt(item.productId),
            destinationLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity),
            type: 'ADJUSTMENT',
            status: adjustment.status
          }))
        });
      }

      // Reload adjustment with updated moves
      const updatedAdjustment = await prisma.adjustment.findUnique({
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
      return res.json(updatedAdjustment);
    }

    res.json(adjustment);
  } catch (error) {
    console.error('Error updating adjustment:', error);
    res.status(500).json({ message: 'Error updating adjustment' });
  }
});

// POST validate adjustment (Draft -> Ready -> Done)
router.post('/:id/validate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await prisma.adjustment.findUnique({
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

    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }

    if (adjustment.status === 'DONE') {
      return res.status(400).json({ message: 'Adjustment is already completed' });
    }

    if (adjustment.status === 'DRAFT') {
      // Move to READY
      const updatedAdjustment = await prisma.adjustment.update({
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
      return res.json(updatedAdjustment);
    }

    if (adjustment.status === 'READY') {
      // Move to DONE and update stock
      if (!adjustment.stockMoves || adjustment.stockMoves.length === 0) {
        return res.status(400).json({ message: 'Adjustment has no items' });
      }

      // Update stock for each move
      for (const move of adjustment.stockMoves) {
        if (!move.destinationLocationId) {
          return res.status(400).json({ 
            message: `Product ${move.product.name} has no location` 
          });
        }

        // Find or create stock record
        let stock = await prisma.stock.findFirst({
          where: {
            productId: move.productId,
            locationId: move.destinationLocationId,
            warehouseId: adjustment.warehouseId
          }
        });

        if (stock) {
          // Update existing stock - set to the new quantity
          await prisma.stock.update({
            where: { id: stock.id },
            data: {
              quantity: move.quantity // Set to the adjustment quantity
            }
          });
        } else {
          // Create new stock record if it doesn't exist
          await prisma.stock.create({
            data: {
              productId: move.productId,
              locationId: move.destinationLocationId,
              warehouseId: adjustment.warehouseId,
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

      // Update adjustment status
      const updatedAdjustment = await prisma.adjustment.update({
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

      return res.json(updatedAdjustment);
    }

    res.status(400).json({ message: 'Invalid adjustment status for validation' });
  } catch (error) {
    console.error('Error validating adjustment:', error);
    res.status(500).json({ message: 'Error validating adjustment' });
  }
});

// DELETE adjustment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!adjustment) {
      return res.status(404).json({ message: 'Adjustment not found' });
    }

    if (adjustment.status === 'DONE') {
      return res.status(400).json({ 
        message: 'Cannot delete completed adjustment' 
      });
    }

    // Delete associated stock moves
    await prisma.stockMove.deleteMany({
      where: { adjustmentId: parseInt(id) }
    });

    // Delete adjustment
    await prisma.adjustment.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Adjustment deleted successfully' });
  } catch (error) {
    console.error('Error deleting adjustment:', error);
    res.status(500).json({ message: 'Error deleting adjustment' });
  }
});

module.exports = router;
