const { prisma } = require('../../helpers/databaseConnection');

class botAdmins {
    static async addAdmins(admins) {
        const adminData = admins.map(admin => ({
            name: admin.name,
            numberPhone: admin.id._serialized,
        }));

        const result = await prisma.admins.createMany({
            data: adminData,
            skipDuplicates: true
        });

        const addedAdmins = result.count > 0 ? admins.slice(0, result.count).map(admin => admin.name) : [];
        return addedAdmins;
    }

    static async checkExistingAdmins(admins) {
        const adminPhones = admins.map(user => user.id._serialized);
        const existingAdmins = await prisma.admins.findMany({
            where: {
                numberPhone: { in: adminPhones }
            },
            select: {
                numberPhone: true
            }
        });

        return existingAdmins.map(admin => admin.numberPhone);
    }
}

module.exports = { botAdmins }