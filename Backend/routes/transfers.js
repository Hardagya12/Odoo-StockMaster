const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate transfer reference: TRANS/YYYY/ID
async function generateTransferReference() {
  const year = new Date().getFullYear();
  const count = await prisma.transfer.count({
    where: {
      reference: {
        startsWith: `TRANS/${year}/`
      }
    }
  });
  const id = String(count + 1).padStart(4, '0');
  return `TRANS/${year}/${id}`;
}

// GET all transfers
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } }
      ];
    }

    const transfers = await prisma.transfer.findMany({
      where,
      include: {
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        },
        stockMoves: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transfers);
  } catch (error) {
    console.error('Error fetching transfers:', error);
    res.status(500).json({ message: 'Error fetching transfers' });
  }
});

// GET single transfer
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id: parseInt(id) },
      include: {
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        },
        stockMoves: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error fetching transfer:', error);
    res.status(500).json({ message: 'Error fetching transfer' });
  }
});

// POST create transfer
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { sourceLocationId, destinationLocationId, scheduledDate, items } = req.body;

    if (!sourceLocationId || !destinationLocationId) {
      return res.status(400).json({ message: 'Source and destination locations are required' });
    }

    if (sourceLocationId === destinationLocationId) {
      return res.status(400).json({ message: 'Source and destination cannot be the same' });
    }

    // Validate locations
    const sourceLocation = await prisma.location.findUnique({
      where: { id: parseInt(sourceLocationId) },
      include: { warehouse: true }
    });

    const destinationLocation = await prisma.location.findUnique({
      where: { id: parseInt(destinationLocationId) },
      include: { warehouse: true }
    });

    if (!sourceLocation || !destinationLocation) {
      return res.status(400).json({ message: 'Invalid location IDs' });
    }

    // Check stock availability for items
    const stockChecks = [];
    if (items && items.length > 0) {
      for (const item of items) {
        const stock = await prisma.stock.findFirst({
          where: {
            productId: parseInt(item.productId),
            locationId: parseInt(sourceLocationId),
            warehouseId: sourceLocation.warehouseId
          }
        });
        stockChecks.push({
          productId: item.productId,
          available: stock ? stock.quantity - stock.reserved : 0,
          required: parseInt(item.quantity)
        });
      }
    }

    // Generate reference
    const reference = await generateTransferReference();

    // Create transfer
    const transfer = await prisma.transfer.create({
      data: {
        reference,
        sourceLocationId: parseInt(sourceLocationId),
        destinationLocationId: parseInt(destinationLocationId),
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'DRAFT',
        stockMoves: items && items.length > 0 ? {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            sourceLocationId: parseInt(sourceLocationId),
            destinationLocationId: parseInt(destinationLocationId),
            quantity: parseInt(item.quantity),
            type: 'INTERNAL',
            status: 'DRAFT'
          }))
        } : undefined
      },
      include: {
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        },
        stockMoves: {
          include: {
            product: true
          }
        }
      }
    });

    res.status(201).json({ ...transfer, stockChecks });
  } catch (error) {
    console.error('Error creating transfer:', error);
    res.status(500).json({ message: 'Error creating transfer' });
  }
});

// PUT update transfer
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceLocationId, destinationLocationId, scheduledDate, items, status } = req.body;

    const existingTransfer = await prisma.transfer.findUnique({
      where: { id: parseInt(id) },
      include: { 
        stockMoves: true,
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } }
      }
    });

    if (!existingTransfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    // Can't update if already DONE
    if (existingTransfer.status === 'DONE') {
      return res.status(400).json({ message: 'Cannot update completed transfer' });
    }

    // Update transfer
    const transfer = await prisma.transfer.update({
      where: { id: parseInt(id) },
      data: {
        sourceLocationId: sourceLocationId ? parseInt(sourceLocationId) : existingTransfer.sourceLocationId,
        destinationLocationId: destinationLocationId ? parseInt(destinationLocationId) : existingTransfer.destinationLocationId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingTransfer.scheduledDate,
        status: status || existingTransfer.status
      },
      include: {
        sourceLocation: { include: { warehouse: true } },
        destinationLocation: { include: { warehouse: true } },
        stockMoves: {
          include: {
            product: true
          }
        }
      }
    });

    // Update items if provided
    if (items) {
      // Delete existing moves
      await prisma.stockMove.deleteMany({
        where: { transferId: parseInt(id) }
      });

      // Create new moves
      if (items.length > 0) {
        await prisma.stockMove.createMany({
          data: items.map(item => ({
            transferId: parseInt(id),
            productId: parseInt(item.productId),
            sourceLocationId: transfer.sourceLocationId,
            destinationLocationId: transfer.destinationLocationId,
            quantity: parseInt(item.quantity),
            type: 'INTERNAL',
            status: transfer.status
          }))
        });
      }

      // Reload transfer with updated moves
      const updatedTransfer = await prisma.transfer.findUnique({
        where: { id: parseInt(id) },
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          stockMoves: {
            include: {
              product: true
            }
          }
        }
      });
      return res.json(updatedTransfer);
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error updating transfer:', error);
    res.status(500).json({ message: 'Error updating transfer' });
  }
});

// POST validate transfer (Draft -> Ready -> Done)
router.post('/:id/validate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id: parseInt(id) },
      include: {
        stockMoves: {
          include: {
            product: true
          }
        },
        sourceLocation: {
          include: { warehouse: true }
        },
        destinationLocation: {
          include: { warehouse: true }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status === 'DONE') {
      return res.status(400).json({ message: 'Transfer is already completed' });
    }

    if (transfer.status === 'DRAFT') {
      // Move to READY
      const updatedTransfer = await prisma.transfer.update({
        where: { id: parseInt(id) },
        data: { status: 'READY' },
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          stockMoves: {
            include: {
              product: true
            }
          }
        }
      });
      return res.json(updatedTransfer);
    }

    if (transfer.status === 'READY') {
      // Move to DONE and update stock
      if (!transfer.stockMoves || transfer.stockMoves.length === 0) {
        return res.status(400).json({ message: 'Transfer has no items' });
      }

      // Update stock for each move
      for (const move of transfer.stockMoves) {
        // Deduct from source location
        const sourceStock = await prisma.stock.findFirst({
          where: {
            productId: move.productId,
            locationId: transfer.sourceLocationId,
            warehouseId: transfer.sourceLocation.warehouseId
          }
        });

        if (!sourceStock || sourceStock.quantity < move.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${move.product.name} at source location` 
          });
        }

        // Update source stock
        await prisma.stock.update({
          where: { id: sourceStock.id },
          data: {
            quantity: sourceStock.quantity - move.quantity
          }
        });

        // Add to destination location
        let destStock = await prisma.stock.findFirst({
          where: {
            productId: move.productId,
            locationId: transfer.destinationLocationId,
            warehouseId: transfer.destinationLocation.warehouseId
          }
        });

        if (destStock) {
          // Update existing stock
          await prisma.stock.update({
            where: { id: destStock.id },
            data: {
              quantity: destStock.quantity + move.quantity
            }
          });
        } else {
          // Create new stock record
          await prisma.stock.create({
            data: {
              productId: move.productId,
              locationId: transfer.destinationLocationId,
              warehouseId: transfer.destinationLocation.warehouseId,
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

      // Update transfer status
      const updatedTransfer = await prisma.transfer.update({
        where: { id: parseInt(id) },
        data: { status: 'DONE' },
        include: {
          sourceLocation: { include: { warehouse: true } },
          destinationLocation: { include: { warehouse: true } },
          stockMoves: {
            include: {
              product: true
            }
          }
        }
      });

      return res.json(updatedTransfer);
    }

    res.status(400).json({ message: 'Invalid transfer status for validation' });
  } catch (error) {
    console.error('Error validating transfer:', error);
    res.status(500).json({ message: 'Error validating transfer' });
  }
});

// DELETE transfer
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.transfer.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }

    if (transfer.status === 'DONE') {
      return res.status(400).json({ 
        message: 'Cannot delete completed transfer' 
      });
    }

    // Delete associated stock moves
    await prisma.stockMove.deleteMany({
      where: { transferId: parseInt(id) }
    });

    // Delete transfer
    await prisma.transfer.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    console.error('Error deleting transfer:', error);
    res.status(500).json({ message: 'Error deleting transfer' });
  }
});

module.exports = router;
