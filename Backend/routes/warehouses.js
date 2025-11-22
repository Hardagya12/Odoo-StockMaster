const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all warehouses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: true,
        _count: {
          select: { stocks: true, receipts: true, deliveries: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ message: 'Error fetching warehouses' });
  }
});

// GET single warehouse
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(id) },
      include: {
        locations: true,
        stocks: {
          include: {
            product: true,
            location: true
          }
        }
      }
    });

    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    res.json(warehouse);
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ message: 'Error fetching warehouse' });
  }
});

// POST create warehouse
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, code, address, capacity } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Warehouse name is required' });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ message: 'Warehouse code is required' });
    }

    // Check if warehouse with same name or code exists
    const existingWarehouse = await prisma.warehouse.findFirst({
      where: {
        OR: [
          { name: name.trim() },
          { code: code.trim().toUpperCase() }
        ]
      }
    });

    if (existingWarehouse) {
      return res.status(400).json({ 
        message: 'Warehouse with this name or code already exists' 
      });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address || null,
        capacity: capacity ? parseInt(capacity) : null,
        isActive: true
      }
    });

    res.status(201).json(warehouse);
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ message: 'Error creating warehouse' });
  }
});

// PUT update warehouse
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, capacity, isActive } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Warehouse name is required' });
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ message: 'Warehouse code is required' });
    }

    // Check if warehouse exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingWarehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Check if name or code is taken by another warehouse
    if (name !== existingWarehouse.name || code !== existingWarehouse.code) {
      const duplicateCheck = await prisma.warehouse.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                { name: name.trim() },
                { code: code.trim().toUpperCase() }
              ]
            }
          ]
        }
      });
      if (duplicateCheck) {
        return res.status(400).json({ 
          message: 'Warehouse name or code already in use' 
        });
      }
    }

    const warehouse = await prisma.warehouse.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address || null,
        capacity: capacity ? parseInt(capacity) : null,
        isActive: isActive !== undefined ? isActive : existingWarehouse.isActive
      },
      include: {
        locations: true
      }
    });

    res.json(warehouse);
  } catch (error) {
    console.error('Error updating warehouse:', error);
    res.status(500).json({ message: 'Error updating warehouse' });
  }
});

// DELETE warehouse
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if warehouse has locations
    const locationCount = await prisma.location.count({
      where: { warehouseId: parseInt(id) }
    });

    if (locationCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete warehouse with locations. Remove locations first.' 
      });
    }

    // Check if warehouse has stock
    const stockCount = await prisma.stock.count({
      where: { warehouseId: parseInt(id) }
    });

    if (stockCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete warehouse with stock. Clear stock first.' 
      });
    }

    await prisma.warehouse.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ message: 'Error deleting warehouse' });
  }
});

module.exports = router;
