const { prisma } = require('../../helpers/databaseConnection');
const logger = require('../../helpers/logger');

class botAdmins {
    static async addAdmins(admins) {
        const isRoleDouble = await this.checkAdminAtUsers(admins);

        if (isRoleDouble.length !== 0) {
            await prisma.users.deleteMany({
                where: {
                    numberPhone: { in: admins.map(admin => admin.id._serialized) }
                }
            });
            logger.info("Successfully switch to admin role.");
        }

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

    static async checkAdminAtUsers(admins) {
        const adminPhones = admins.map(user => user.id._serialized);
        const adminsExistAsUsers = await prisma.users.findMany({
            where: {
                numberPhone: { in: adminPhones }
            },
            select: {
                numberPhone: true
            }
        });

        return adminsExistAsUsers.map(admin => admin.numberPhone);
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