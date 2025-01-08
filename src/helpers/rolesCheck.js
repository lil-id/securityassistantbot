const prisma = require('./databaseConnection');

async function checkRoles(adminPhoneNumber) {
    const admin = await prisma.admins.findUnique({
        where: {
            numberPhone: adminPhoneNumber
        },
        select: {
            role: true
        }
    });
    return admin.role;
}

module.exports = { checkRoles };