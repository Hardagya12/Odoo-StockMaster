require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stock');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const warehouseRoutes = require('./routes/warehouses');
const locationRoutes = require('./routes/locations');
const receiptRoutes = require('./routes/receipts');
const deliveryRoutes = require('./routes/deliveries');
const transferRoutes = require('./routes/transfers');
const adjustmentRoutes = require('./routes/adjustments');
const stockMoveRoutes = require('./routes/stockMoves');
const dashboardRoutes = require('./routes/dashboard');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('StockMaster Backend is running');
});

// Auth routes
app.use('/api/auth', authRoutes);
// Stock routes
app.use('/api/stock', stockRoutes);
// Product routes
app.use('/api/products', productRoutes);
// Category routes
app.use('/api/categories', categoryRoutes);
// Warehouse routes
app.use('/api/warehouses', warehouseRoutes);
// Location routes
app.use('/api/locations', locationRoutes);
// Receipt routes
app.use('/api/receipts', receiptRoutes);
// Delivery routes
app.use('/api/deliveries', deliveryRoutes);
// Transfer routes
app.use('/api/transfers', transferRoutes);
// Adjustment routes
app.use('/api/adjustments', adjustmentRoutes);
// Stock move routes
app.use('/api/stock-moves', stockMoveRoutes);
// Dashboard routes
app.use('/api/dashboard', dashboardRoutes);


// Database connection check
async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to the database successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});

main();
