const { prisma } = require("../../helpers/databaseConnection");
const logger = require("../../helpers/logger");

class botAdmins {
    static async addAdmins(admins) {
        const isRoleDouble = await this.checkAdminAtUsers(admins);

        if (isRoleDouble.length !== 0) {
            await prisma.users.deleteMany({
                where: {
                    numberPhone: {
                        in: admins.map((admin) => admin.id._serialized),
                    },
                },
            });
            logger.info("Successfully switch to admin role.");
        }

        const adminData = admins.map((admin) => ({
            name: admin.name,
            numberPhone: admin.id._serialized,
        }));

        const result = await prisma.admins.createMany({
            data: adminData,
            skipDuplicates: true,
        });

        const addedAdmins =
            result.count > 0
                ? admins.slice(0, result.count).map((admin) => admin.name)
                : [];
        return addedAdmins;
    }

    // Check if admins are already in the user table
    static async checkAdminAtUsers(admins) {
        const adminPhones = admins.map((user) => user.id._serialized);
        const adminsExistAsUsers = await prisma.users.findMany({
            where: {
                numberPhone: { in: adminPhones },
            },
            select: {
                numberPhone: true,
            },
        });

        return adminsExistAsUsers.map((admin) => admin.numberPhone);
    }

    static async checkExistingAdmins(admins) {
        const adminPhones = admins.map((user) => user.id._serialized);
        const existingAdmins = await prisma.admins.findMany({
            where: {
                numberPhone: { in: adminPhones },
            },
            select: {
                numberPhone: true,
            },
        });

        return existingAdmins.map((admin) => admin.numberPhone);
    }

    static async deleteAdmins(admins) {
        if (!admins || admins.length === 0) {
            logger.error(
                "deleteAdmins() received empty admins array or undefined"
            );
            return [];
        }

        const adminPhones = admins.map((admin) => admin.id._serialized);

        const defaultBotNumberPhone = await prisma.admins.findMany({
            where: {
                name: "First Admin",
            },
            select: {
                numberPhone: true,
            },
        });

        // Extract the phone numbers of "First Admin" from the query result
        const botAdminPhones = defaultBotNumberPhone.map((admin) => admin.numberPhone);

        // Check if any of the adminPhones match the defaultBotNumberPhone
        const isBotAdminIncluded = adminPhones.some((phone) => 
            botAdminPhones.includes(phone)
        );

        if (isBotAdminIncluded) {
            logger.error("⚠️ Cannot delete the bot admin");
            return [];
        }

        const deletedAdmins = await prisma.admins.deleteMany({
            where: {
                numberPhone: { in: adminPhones },
            },
        });

        if (!deletedAdmins || deletedAdmins.count === 0) {
            logger.warn("⚠️ No admins were deleted (possible duplicates)");
            return [];
        }

        return admins.slice(0, deletedAdmins.count).map((admin) => admin.name);
    }
}

module.exports = { botAdmins };
