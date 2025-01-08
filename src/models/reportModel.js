const prisma = require('../helpers/databaseConnection');

class reportBot {
    static async getUserId(userPhoneNumber) {
        const user = await prisma.users.findUnique({
            where: {
                numberPhone: userPhoneNumber
            },
            select: {
                id: true
            }
        });
        return user.id;
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

    static async getReportById(userPhoneNumber) {
        const userId = await this.getUserId(userPhoneNumber);
        const report = await prisma.reports.findMany({
            where: { idUser: userId },
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        if (report.length === 0) {
            return "No report available.";
        }
        
        return report.map((report) => (
            `📝 *Report #${report.id}*\n` +
            `👤 *Name:* ${report.user.name}\n` +
            `📱 *Phone:* ${report.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${report.report}\n`
        )).join('\n');
    }
}

module.exports = { reportBot };
