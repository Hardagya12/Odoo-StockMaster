require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

console.log('Initializing Prisma Client...');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

const app = express();
let prisma;
try {
    prisma = new PrismaClient();
    console.log('Prisma Client initialized.');
} catch (e) {
    console.error('Failed to initialize Prisma Client:', e);
    process.exit(1);
}

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.send('StockMaster Backend is running');
});

// Database connection check
async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected to the database successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

main();
