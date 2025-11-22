const prismaLib = require('@prisma/client');
console.log('Type of prismaLib:', typeof prismaLib);
console.log('Keys:', Object.keys(prismaLib));
console.log('PrismaClient:', prismaLib.PrismaClient);
