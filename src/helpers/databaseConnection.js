const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');
const prisma = new PrismaClient();

async function checkDatabaseConnection() {
    try {
        await prisma.$connect();
        logger.info('Database connected successfully.');
        logger.info('Waiting whatsapp client ready...');
    } catch (error) {
        logger.error('Error connecting to the database:', error.message);
        setTimeout(checkDatabaseConnection, 5000); // Retry after 5 seconds
    }
}

module.exports = { prisma, checkDatabaseConnection };