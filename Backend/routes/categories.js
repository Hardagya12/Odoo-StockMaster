const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET all categories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        children: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// GET single category
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: true,
        children: true,
        products: true
      }
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// POST create category
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, parentId } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category already exists
    const existingCategory = await prisma.category.findUnique({
      where: { name }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Validate parent if provided
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parseInt(parentId) }
      });
      if (!parent) {
        return res.status(400).json({ message: 'Invalid parent category ID' });
      }
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description || null,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        parent: true
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// PUT update category
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentId } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if name is taken by another category
    if (name !== existingCategory.name) {
      const nameCheck = await prisma.category.findUnique({
        where: { name }
      });
      if (nameCheck) {
        return res.status(400).json({ message: 'Category name already in use' });
      }
    }

    // Validate parent if provided (prevent circular references)
    if (parentId) {
      if (parseInt(parentId) === parseInt(id)) {
        return res.status(400).json({ message: 'Category cannot be its own parent' });
      }
      const parent = await prisma.category.findUnique({
        where: { id: parseInt(parentId) }
      });
      if (!parent) {
        return res.status(400).json({ message: 'Invalid parent category ID' });
      }
    }

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        description: description || null,
        parentId: parentId ? parseInt(parentId) : null
      },
      include: {
        parent: true,
        children: true
      }
    });

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// DELETE category
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: parseInt(id) }
    });

    if (productCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated products. Remove products first.' 
      });
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentId: parseInt(id) }
    });

    if (childrenCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Remove subcategories first.' 
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
