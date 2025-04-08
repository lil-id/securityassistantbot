const { prisma } = require('../../helpers/databaseConnection');
const logger = require('../../helpers/logger');

class botUsers {
    static async addUsers(users) {
        if (!users || users.length === 0) {
            logger.error("addUsers() received empty users array or undefined");
            return [];
        }

        const isRoleDouble = await this.checkUserAtAdmins(users);

        if (isRoleDouble.length !== 0) {
            await prisma.admins.deleteMany({
                where: {
                    numberPhone: { in: users.map(user => user.id._serialized) }
                }
            });
            logger.info("Successfully switch to user role.");
        }
    
        const userData = users.map(user => ({
            name: user.name,
            numberPhone: user.id._serialized,
        }));
    
        const result = await prisma.users.createMany({
            data: userData,
            skipDuplicates: true
        });
    

        if (!result || result.count === 0) {
            logger.warn("⚠️ No new users were added (possible duplicates)");
            return [];
        }
    
        return users.slice(0, result.count).map(user => user.name);
    }

    // We can switch the role of the user to admin by !admin or vice versa !user command
    // but before we switch the role, we need check if users are already in the admin table or not
    static async checkUserAtAdmins(users) {
        const userPhones = users.map(user => user.id._serialized);
        const usersExistAsAdmins = await prisma.admins.findMany({
            where: {
                numberPhone: { in: userPhones }
            },
            select: {
                numberPhone: true
            }
        });

        return usersExistAsAdmins.map(user => user.numberPhone);
    }

    static async checkExistingUsers(users) {
        const userPhones = users.map(user => user.id._serialized);
        const existingUsers = await prisma.users.findMany({
            where: {
                numberPhone: { in: userPhones }
            },
            select: {
                numberPhone: true
            }
        });

        return existingUsers.map(user => user.numberPhone);
    }

    static async deleteUsers(users) {
        if (!users || users.length === 0) {
            logger.error("deleteUsers() received empty users array or undefined");
            return [];
        }

        const userPhones = users.map(user => user.id._serialized);
        const deletedUsers = await prisma.users.deleteMany({
            where: {
                numberPhone: { in: userPhones }
            }
        });

        if (!deletedUsers || deletedUsers.count === 0) {
            logger.warn("⚠️ No users were deleted (possible duplicates)");
            return [];
        }

        return users.slice(0, deletedUsers.count).map(user => user.name);
    }
}

module.exports = { botUsers }