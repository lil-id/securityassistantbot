const { prisma } = require('./databaseConnection');

async function checkRoles(sender) {
    const admin = await prisma.admins.findUnique({
        where: {
            numberPhone: sender
        },
        select: {
            id: true,
            name: true,
            role: true
        }
    });
    return admin;
}

module.exports = { checkRoles };