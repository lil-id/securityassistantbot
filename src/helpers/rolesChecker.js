const { prisma } = require('./databaseConnection');

async function checkRoles(sender) {
    // Check in the admins table
    let adminOrUser = await prisma.admins.findUnique({
        where: {
            numberPhone: sender
        },
        select: {
            id: true,
            name: true,
            role: true
        }
    });

    // If not found in admins, check in the users table
    if (!adminOrUser) {
        adminOrUser = await prisma.users.findUnique({
            where: {
                numberPhone: sender
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });
    }

    return adminOrUser || null;
}

module.exports = { checkRoles };