// Backend/routes/stock.js
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('../middleware/auth'); // existing auth middleware

// GET stock for a specific warehouse (or all)
// Use query param ?warehouseId= to filter, otherwise returns all
router.get('/', verifyToken, async (req, res) => {
    const warehouseId = req.query.warehouseId ? Number(req.query.warehouseId) : undefined;
    const where = warehouseId ? { warehouseId } : {};
    const stock = await prisma.stock.findMany({
        where,
        include: {
            product: true,
            location: true,
            warehouse: true,
        },
    });
    res.json(stock);
});

// POST adjust stock (increase or decrease)
router.post('/', verifyToken, async (req, res) => {
    const { productId, locationId, warehouseId, quantityChange } = req.body;

    if (!productId || !locationId || !warehouseId || typeof quantityChange !== 'number') {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find existing stock record or create a new one
    let stock = await prisma.stock.findFirst({
        where: { productId, locationId, warehouseId },
    });

    if (!stock) {
        // Create new record if it doesn't exist
        stock = await prisma.stock.create({
            data: {
                productId,
                locationId,
                warehouseId,
                quantity: Math.max(0, quantityChange),
                reserved: 0,
            },
        });
        return res.json(stock);
    }

    // Update quantity, ensuring it never goes negative
    const newQty = stock.quantity + quantityChange;
    if (newQty < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
    }

    stock = await prisma.stock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
    });

    res.json(stock);
});

module.exports = router;