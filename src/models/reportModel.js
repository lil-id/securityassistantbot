const { prisma } = require("../helpers/databaseConnection");
const logger = require("../helpers/logger");

class reportBot {
    static async getUserIds(userPhoneNumbers) {
        if (!Array.isArray(userPhoneNumbers)) {
            userPhoneNumbers = [userPhoneNumbers];
        }

        const admins = await prisma.admins.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers },
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        const users = await prisma.users.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers },
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
        });

        if (admins.length === 0 && users.length === 0) {
            return [];
        }

        const adminIds = admins.map((admin) => ({
            id: admin.id,
            name: admin.name,
            role: admin.role,
        }));
        const userIds = users.map((user) => ({
            id: user.id,
            name: user.name,
            role: user.role,
        }));

        return [...adminIds, ...userIds];
    }

    static async createReport(sender, evidence, report) {
        logger.info("Creating report");
        const userIds = await this.getUserIds(sender);

        for (const userId of userIds) {
            if (userId.role === "admin") {
                return await prisma.reportAdmins.create({
                    data: {
                        idAdmin: userId.id,
                        name: userId.name,
                        evidence: evidence,
                        report: report,
                    },
                });
            }

            await prisma.reportUsers.create({
                data: {
                    idUser: userId.id,
                    name: userId.name,
                    evidence: evidence,
                    report: report,
                },
            });
        }
        return;
    }

    static async getReports() {
        logger.info("Getting reports");
        const reportAdmins = await prisma.reportAdmins.findMany({
            include: {
                admin: {
                    select: {
                        name: true,
                        numberPhone: true,
                    },
                },
            },
        });

        const reportUsers = await prisma.reportUsers.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true,
                    },
                },
            },
        });

        if (reportAdmins.length === 0 && reportUsers.length === 0) {
            return "No report available.";
        }

        const reports = [...reportAdmins, ...reportUsers];
        let reportNumber = 1;

        return reports
            .map(
                (report) => (
                    `📝 *Report #${reportNumber++}*\n` +
                        `👤 *Name:* ${report.name}\n` +
                        `📱 *Phone:* ${
                            report.admin?.numberPhone
                                ? report.admin.numberPhone.replace("@c.us", "")
                                : report.user?.numberPhone
                                ? report.user.numberPhone.replace("@c.us", "")
                                : "Missing or Not Found"
                        }\n` +
                        `💬 *Message:* ${report.report}\n`
                )
            )
            .join("\n");
    }

    static async getReportById(userPhoneNumbers) {
        logger.info("Getting reports for:", userPhoneNumbers);
        const userIds = await this.getUserIds(userPhoneNumbers);
        const reportAdmins = await prisma.reportAdmins.findMany({
            where: {
                idAdmin: {
                    in: userIds.map((user) => user.id),
                },
            },
            include: {
                admin: {
                    select: {
                        name: true,
                        numberPhone: true,
                    },
                },
            },
        });

        const reportUsers = await prisma.reportUsers.findMany({
            where: {
                idUser: {
                    in: userIds.map((user) => user.id),
                },
            },
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true,
                    },
                },
            },
        });

        if (reportAdmins.length === 0 && reportUsers.length === 0) {
            return "No report available.";
        }

        const reports = [...reportAdmins, ...reportUsers];
        let reportNumber = 1;

        return reports
            .map(
                (report) =>
                    `📝 *Report #${reportNumber++}*\n` +
                    `👤 *Name:* ${
                        report.admin ? report.admin.name : report.user.name
                    }n` +
                    `📱 *Phone:* ${
                        report.admin
                            ? report.admin.numberPhone.replace("@c.us", "")
                            : report.user.numberPhone.replace("@c.us", "")
                    }\n` +
                    `💬 *Message:* ${report.report}\n`
            )
            .join("\n");
    }
}

module.exports = { reportBot };
