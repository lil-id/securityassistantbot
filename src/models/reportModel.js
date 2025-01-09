const prisma = require('../helpers/databaseConnection');

class reportBot {
    static async getUserIds(userPhoneNumbers) {
        const users = await prisma.users.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers }
            },
            select: {
                id: true,
                name: true,
            }
        });
        return users.map(user => ({ id: user.id, name: user.name }));
    }

    static async createReport(sender, evidence, report) {
        const userId = await this.getUserIds(sender);
        await prisma.reports.create({
            data: {
                idUser: userId.id,
                name: userId.name,
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
            where: {
                idUser: { 
                    in: userIds.map(user => user.id) 
                }
            },
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
