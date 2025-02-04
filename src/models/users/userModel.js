const { prisma } = require('../../helpers/databaseConnection');

class botUsers {
    static async addUsers(users) {
        const userData = users.map(user => ({
            name: user.name,
            numberPhone: user.id._serialized,
        }));

        const result = await prisma.users.createMany({
            data: userData,
            skipDuplicates: true
        });

        const addedUsers = result.count > 0 ? users.slice(0, result.count).map(user => user.name) : [];
        return addedUsers;
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
}

module.exports = { botUsers }