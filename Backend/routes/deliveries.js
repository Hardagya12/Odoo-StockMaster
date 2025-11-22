const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate delivery reference: WW/OUT/YYYY/ID
async function generateDeliveryReference(warehouseCode) {
  const year = new Date().getFullYear();
  const count = await prisma.delivery.count({
    where: {
      reference: {
        startsWith: `${warehouseCode}/OUT/${year}/`
      }
    }
  });
  const id = String(count + 1).padStart(4, '0');
  return `${warehouseCode}/OUT/${year}/${id}`;
}

// GET all deliveries
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
        { customer: { contains: search, mode: 'insensitive' } },
        { sourceDoc: { contains: search, mode: 'insensitive' } }
      ];
    }

    const deliveries = await prisma.delivery.findMany({
      where,
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            sourceLocation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ message: 'Error fetching deliveries' });
  }
});

// GET single delivery
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
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
            sourceLocation: true
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({ message: 'Error fetching delivery' });
  }
});

// POST create delivery
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId, customer, sourceDoc, scheduledDate, deliveryAddress, items } = req.body;

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
    const reference = await generateDeliveryReference(warehouse.code);

    // Check stock availability for items
    const stockChecks = [];
    if (items && items.length > 0) {
      for (const item of items) {
        if (item.locationId) {
          const stock = await prisma.stock.findFirst({
            where: {
              productId: parseInt(item.productId),
              locationId: parseInt(item.locationId),
              warehouseId: parseInt(warehouseId)
            }
          });
          stockChecks.push({
            productId: item.productId,
            locationId: item.locationId,
            available: stock ? stock.quantity - stock.reserved : 0,
            required: parseInt(item.quantity)
          });
        }
      }
    }

    // Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        reference,
        warehouseId: parseInt(warehouseId),
        customer: customer || null,
        sourceDoc: sourceDoc || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        status: 'DRAFT',
        stockMoves: items && items.length > 0 ? {
          create: items.map(item => ({
            productId: parseInt(item.productId),
            sourceLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity),
            type: 'OUTGOING',
            status: 'DRAFT'
          }))
        } : undefined
      },
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            sourceLocation: true
          }
        }
      }
    });

    // Determine initial status based on stock availability
    let initialStatus = 'DRAFT';
    const hasInsufficientStock = stockChecks.some(check => check.available < check.required);
    if (hasInsufficientStock && items && items.length > 0) {
      initialStatus = 'WAITING';
      // Update delivery status
      const updatedDelivery = await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'WAITING' },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              sourceLocation: true
            }
          }
        }
      });
      return res.status(201).json({ ...updatedDelivery, stockChecks });
    }

    res.status(201).json({ ...delivery, stockChecks });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ message: 'Error creating delivery' });
  }
});

// PUT update delivery
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { customer, sourceDoc, scheduledDate, deliveryAddress, items, status } = req.body;

    const existingDelivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: { stockMoves: true, warehouse: true }
    });

    if (!existingDelivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Can't update if already DONE
    if (existingDelivery.status === 'DONE') {
      return res.status(400).json({ message: 'Cannot update completed delivery' });
    }

    // Update delivery
    const delivery = await prisma.delivery.update({
      where: { id: parseInt(id) },
      data: {
        customer: customer !== undefined ? customer : existingDelivery.customer,
        sourceDoc: sourceDoc !== undefined ? sourceDoc : existingDelivery.sourceDoc,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : existingDelivery.scheduledDate,
        status: status || existingDelivery.status
      },
      include: {
        warehouse: true,
        stockMoves: {
          include: {
            product: true,
            sourceLocation: true
          }
        }
      }
    });

    // Update items if provided
    if (items) {
      // Delete existing moves
      await prisma.stockMove.deleteMany({
        where: { deliveryId: parseInt(id) }
      });

      // Check stock availability
      const stockChecks = [];
      for (const item of items) {
        if (item.locationId) {
          const stock = await prisma.stock.findFirst({
            where: {
              productId: parseInt(item.productId),
              locationId: parseInt(item.locationId),
              warehouseId: existingDelivery.warehouseId
            }
          });
          stockChecks.push({
            productId: item.productId,
            locationId: item.locationId,
            available: stock ? stock.quantity - stock.reserved : 0,
            required: parseInt(item.quantity)
          });
        }
      }

      // Create new moves
      if (items.length > 0) {
        await prisma.stockMove.createMany({
          data: items.map(item => ({
            deliveryId: parseInt(id),
            productId: parseInt(item.productId),
            sourceLocationId: item.locationId ? parseInt(item.locationId) : null,
            quantity: parseInt(item.quantity),
            type: 'OUTGOING',
            status: delivery.status
          }))
        });
      }

      // Check if should be WAITING
      const hasInsufficientStock = stockChecks.some(check => check.available < check.required);
      let finalStatus = delivery.status;
      if (hasInsufficientStock && delivery.status === 'DRAFT') {
        finalStatus = 'WAITING';
        await prisma.delivery.update({
          where: { id: parseInt(id) },
          data: { status: 'WAITING' }
        });
      }

      // Reload delivery with updated moves
      const updatedDelivery = await prisma.delivery.findUnique({
        where: { id: parseInt(id) },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              sourceLocation: true
            }
          }
        }
      });
      return res.json({ ...updatedDelivery, stockChecks });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Error updating delivery' });
  }
});

// POST validate delivery (Draft -> Waiting -> Ready -> Done)
router.post('/:id/validate', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) },
      include: {
        stockMoves: {
          include: {
            product: true,
            sourceLocation: true
          }
        },
        warehouse: true
      }
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({ message: 'Delivery is already completed' });
    }

    if (delivery.status === 'DRAFT') {
      // Check stock availability
      const stockChecks = [];
      for (const move of delivery.stockMoves) {
        if (move.sourceLocationId) {
          const stock = await prisma.stock.findFirst({
            where: {
              productId: move.productId,
              locationId: move.sourceLocationId,
              warehouseId: delivery.warehouseId
            }
          });
          const available = stock ? stock.quantity - stock.reserved : 0;
          stockChecks.push({
            productId: move.productId,
            locationId: move.sourceLocationId,
            available,
            required: move.quantity
          });
        }
      }

      const hasInsufficientStock = stockChecks.some(check => check.available < check.required);
      const newStatus = hasInsufficientStock ? 'WAITING' : 'READY';

      const updatedDelivery = await prisma.delivery.update({
        where: { id: parseInt(id) },
        data: { status: newStatus },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              sourceLocation: true
            }
          }
        }
      });
      return res.json({ ...updatedDelivery, stockChecks });
    }

    if (delivery.status === 'WAITING') {
      // Check if stock is now available
      const stockChecks = [];
      for (const move of delivery.stockMoves) {
        if (move.sourceLocationId) {
          const stock = await prisma.stock.findFirst({
            where: {
              productId: move.productId,
              locationId: move.sourceLocationId,
              warehouseId: delivery.warehouseId
            }
          });
          const available = stock ? stock.quantity - stock.reserved : 0;
          stockChecks.push({
            productId: move.productId,
            locationId: move.sourceLocationId,
            available,
            required: move.quantity
          });
        }
      }

      const hasInsufficientStock = stockChecks.some(check => check.available < check.required);
      if (hasInsufficientStock) {
        return res.status(400).json({ 
          message: 'Insufficient stock available', 
          stockChecks 
        });
      }

      // Move to READY
      const updatedDelivery = await prisma.delivery.update({
        where: { id: parseInt(id) },
        data: { status: 'READY' },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              sourceLocation: true
            }
          }
        }
      });
      return res.json(updatedDelivery);
    }

    if (delivery.status === 'READY') {
      // Move to DONE and update stock
      if (!delivery.stockMoves || delivery.stockMoves.length === 0) {
        return res.status(400).json({ message: 'Delivery has no items' });
      }

      // Update stock for each move
      for (const move of delivery.stockMoves) {
        if (!move.sourceLocationId) {
          return res.status(400).json({ 
            message: `Product ${move.product.name} has no source location` 
          });
        }

        // Find stock record
        const stock = await prisma.stock.findFirst({
          where: {
            productId: move.productId,
            locationId: move.sourceLocationId,
            warehouseId: delivery.warehouseId
          }
        });

        if (!stock || stock.quantity < move.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for product ${move.product.name}` 
          });
        }

        // Update stock
        await prisma.stock.update({
          where: { id: stock.id },
          data: {
            quantity: stock.quantity - move.quantity
          }
        });

        // Update move status
        await prisma.stockMove.update({
          where: { id: move.id },
          data: { status: 'DONE' }
        });
      }

      // Update delivery status
      const updatedDelivery = await prisma.delivery.update({
        where: { id: parseInt(id) },
        data: { status: 'DONE' },
        include: {
          warehouse: true,
          stockMoves: {
            include: {
              product: true,
              sourceLocation: true
            }
          }
        }
      });

      return res.json(updatedDelivery);
    }

    res.status(400).json({ message: 'Invalid delivery status for validation' });
  } catch (error) {
    console.error('Error validating delivery:', error);
    res.status(500).json({ message: 'Error validating delivery' });
  }
});

// DELETE delivery
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const delivery = await prisma.delivery.findUnique({
      where: { id: parseInt(id) }
    });

    if (!delivery) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    if (delivery.status === 'DONE') {
      return res.status(400).json({ 
        message: 'Cannot delete completed delivery' 
      });
    }

    // Delete associated stock moves
    await prisma.stockMove.deleteMany({
      where: { deliveryId: parseInt(id) }
    });

    // Delete delivery
    await prisma.delivery.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Delivery deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({ message: 'Error deleting delivery' });
  }
});

module.exports = router;
