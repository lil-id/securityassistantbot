const prisma = require('../helpers/databaseConnection');

class reportBot {
    static async getUserIds(userPhoneNumbers) {
        const users = await prisma.users.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers }
            },
            select: {
                id: true
            }
        });
        return users.map(user => user.id);
    }

    static async createReport(sender, evidence, report) {
        const userId = await this.getUserId(sender);
        await prisma.reports.create({
            data: {
                idUser: userId,
                evidence: evidence,
                report: report,
            }
        });
        return;
    }

    static async getReports() {
        const reports = await prisma.reports.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        if (reports.length === 0) {
            return "No report available.";
        }

        return reports.map((report) => (
            `📝 *Report #${report.id}*\n` +
            `👤 *Name:* ${report.user.name}\n` +
            `📱 *Phone:* ${report.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${report.report}\n`
        )).join('\n');
    }

    static async getReportById(userPhoneNumbers) {
        const userIds = await this.getUserIds(userPhoneNumbers);
        const reports = await prisma.reports.findMany({
            where: { idUser: { in: userIds } },
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        if (reports.length === 0) {
            return "No report available.";
        }
        
        return reports.map((report) => (
            `📝 *Report #${report.id}*\n` +
            `👤 *Name:* ${report.user.name}\n` +
            `📱 *Phone:* ${report.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${report.report}\n`
        )).join('\n');
    }
}

module.exports = { reportBot };
