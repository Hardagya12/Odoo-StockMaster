const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all locations (optionally filtered by warehouse)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const where = warehouseId ? { warehouseId: parseInt(warehouseId) } : {};

    const locations = await prisma.location.findMany({
      where,
      include: {
        warehouse: true,
        _count: {
          select: { stocks: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching locations' });
  }
});

// GET single location
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const location = await prisma.location.findUnique({
      where: { id: parseInt(id) },
      include: {
        warehouse: true,
        stocks: {
          include: {
            product: true
          }
        }
      }
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: 'Error fetching location' });
  }
});

// POST create location
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, code, warehouseId, type } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Location name is required' });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ message: 'Location code is required' });
    }

    if (!warehouseId) {
      return res.status(400).json({ message: 'Warehouse ID is required' });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    });

    if (!warehouse) {
      return res.status(400).json({ message: 'Invalid warehouse ID' });
    }

    // Check if location with same code exists
    const existingLocation = await prisma.location.findUnique({
      where: { code: code.trim().toUpperCase() }
    });

    if (existingLocation) {
      return res.status(400).json({ 
        message: 'Location with this code already exists' 
      });
    }

    // Check if location with same name exists in this warehouse
    const existingLocationInWarehouse = await prisma.location.findFirst({
      where: {
        warehouseId: parseInt(warehouseId),
        name: name.trim()
      }
    });

    if (existingLocationInWarehouse) {
      return res.status(400).json({ 
        message: 'Location with this name already exists in this warehouse' 
      });
    }

    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        warehouseId: parseInt(warehouseId),
        type: type || 'ZONE'
      },
      include: {
        warehouse: true
      }
    });

    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Error creating location' });
  }
});

// PUT update location
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, warehouseId, type } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Location name is required' });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ message: 'Location code is required' });
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLocation) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if code is taken by another location
    if (code !== existingLocation.code) {
      const codeCheck = await prisma.location.findUnique({
        where: { code: code.trim().toUpperCase() }
      });
      if (codeCheck) {
        return res.status(400).json({ message: 'Location code already in use' });
      }
    }

    // Check if name is taken by another location in the same warehouse
    const finalWarehouseId = warehouseId ? parseInt(warehouseId) : existingLocation.warehouseId;
    if (name !== existingLocation.name || finalWarehouseId !== existingLocation.warehouseId) {
      const nameCheck = await prisma.location.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            { warehouseId: finalWarehouseId },
            { name: name.trim() }
          ]
        }
      });
      if (nameCheck) {
        return res.status(400).json({ 
          message: 'Location name already exists in this warehouse' 
        });
      }
    }

    // Validate warehouse if changed
    if (warehouseId && parseInt(warehouseId) !== existingLocation.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: parseInt(warehouseId) }
      });
      if (!warehouse) {
        return res.status(400).json({ message: 'Invalid warehouse ID' });
      }
    }

    const location = await prisma.location.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        warehouseId: finalWarehouseId,
        type: type || existingLocation.type
      },
      include: {
        warehouse: true
      }
    });

    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location' });
  }
});

// DELETE location
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if location has stock
    const stockCount = await prisma.stock.count({
      where: { locationId: parseInt(id) }
    });

    if (stockCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete location with stock. Clear stock first.' 
      });
    }

    await prisma.location.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Error deleting location' });
  }
});

module.exports = router;
