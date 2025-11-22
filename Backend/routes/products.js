const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware for product creation/update
const validateProduct = (req, res, next) => {
  const { sku, name, unitOfMeasure } = req.body;
  const errors = [];

  if (!sku || typeof sku !== 'string' || sku.trim() === '') {
    errors.push('SKU is required and must be a non-empty string');
  }
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }
  if (!unitOfMeasure || typeof unitOfMeasure !== 'string' || unitOfMeasure.trim() === '') {
    errors.push('Unit of Measure is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};

// GET all products
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search, categoryId, active } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        stocks: {
          select: {
            quantity: true,
            location: {
              select: { name: true }
            },
            warehouse: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate total stock for each product
    const productsWithStock = products.map(p => ({
      ...p,
      totalStock: p.stocks.reduce((sum, s) => sum + s.quantity, 0)
    }));

    res.json(productsWithStock);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// GET single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        stocks: {
          include: {
            location: true,
            warehouse: true
          }
        }
      },
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// POST create product
router.post('/', authMiddleware, validateProduct, async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      categoryId,
      unitOfMeasure,
      unitPrice,
      minStock,
      isActive
    } = req.body;

    // Check if SKU exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku }
    });

    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Check if Category exists if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) }
      });
      if (!category) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
    }

    const product = await prisma.product.create({
      data: {
        sku,
        name,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        unitOfMeasure,
        unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
        minStock: minStock ? parseInt(minStock) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true
      }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

// PUT update product
router.put('/:id', authMiddleware, validateProduct, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      description,
      categoryId,
      unitOfMeasure,
      unitPrice,
      minStock,
      isActive
    } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if SKU is taken by another product
    if (sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({
        where: { sku }
      });
      if (skuCheck) {
        return res.status(400).json({ message: 'SKU already in use by another product' });
      }
    }

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        sku,
        name,
        description,
        categoryId: categoryId ? parseInt(categoryId) : null,
        unitOfMeasure,
        unitPrice: unitPrice ? parseFloat(unitPrice) : 0,
        minStock: minStock ? parseInt(minStock) : 0,
        isActive: isActive !== undefined ? isActive : true,
      },
      include: {
        category: true
      }
    });

    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check relationships before deleting
    // If there are stocks, transactions, etc. related to this product, we might want to prevent deletion or soft delete.
    // For now, let's check stocks.

    const stockCount = await prisma.stock.count({
      where: {
        productId: parseInt(id),
        quantity: { gt: 0 }
      }
    });

    if (stockCount > 0) {
      return res.status(400).json({ message: 'Cannot delete product with existing stock. Archive it instead.' });
    }

    // Check for stock moves
    const moveCount = await prisma.stockMove.count({
        where: { productId: parseInt(id) }
    });

    if (moveCount > 0) {
        // Soft delete (set inactive) if it has history
        const product = await prisma.product.update({
            where: { id: parseInt(id) },
            data: { isActive: false }
        });
        return res.json({ message: 'Product has history, set to inactive instead of deleted', product });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

module.exports = router;
