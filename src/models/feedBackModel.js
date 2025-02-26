const { prisma } = require('../helpers/databaseConnection');
const logger = require('../helpers/logger');

class feedBack {
    static async getUserIds(userPhoneNumbers) {
        if (!Array.isArray(userPhoneNumbers)) {
            userPhoneNumbers = [userPhoneNumbers];
        }

        const admins = await prisma.admins.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers }
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });

        const users = await prisma.users.findMany({
            where: {
                numberPhone: { in: userPhoneNumbers }
            },
            select: {
                id: true,
                name: true,
                role: true
            }
        });


        if (admins.length === 0 && users.length === 0) {
            return [];
        }

        const adminIds = admins.map(admin => ({ id: admin.id, name: admin.name, role: admin.role }));
        const userIds = users.map(user => ({ id: user.id, name: user.name, role: user.role }));

        return [...adminIds, ...userIds];
    }

    static async createFeedback(sender, feedback) {
        logger.info('Creating feedback');
        const userIds = await this.getUserIds(sender);

        for (const userId of userIds) {
            if (userId.role === 'admin') {
                return await prisma.feedbackAdmins.create({
                    data: {
                        idAdmin: userId.id,
                        name: userId.name,
                        feedback: feedback,
                    }
                });
            }

            await prisma.feedbackUsers.create({
                data: {
                    idUser: userId.id,
                    name: userId.name,
                    feedback: feedback,
                }
            });
        }
        return;
    }

    static async getFeedbacks() {
        logger.info('Getting feedbacks');
        const feedbackAdmins = await prisma.feedbackAdmins.findMany({
            include: {
                admin: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        const feedbackUsers = await prisma.feedbackUsers.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        if (feedbackAdmins.length === 0 && feedbackUsers.length === 0) {
            return "No feedback available.";
        }

        const feedbacks = [...feedbackAdmins, ...feedbackUsers];
        let feedbackNumber = 1;

        return feedbacks.map((feedback) => (
            `📝 *Feedback #${feedbackNumber++}*\n` +
            `👤 *Name:* ${feedback.name}\n` +
            `📱 *Phone:* ${
                feedback.admin?.numberPhone
                    ? feedback.admin.numberPhone.replace("@c.us", "")
                    : feedback.user?.numberPhone
                    ? feedback.user.numberPhone.replace("@c.us", "")
                    : "Missing or Not Found"
            }\n` +
            `💬 *Message:* ${feedback.feedback}\n`
        )).join('\n');
    }

    static async getFeedbackById(userPhoneNumbers) {
        logger.info('Getting feedbacks for:', userPhoneNumbers);
        const userIds = await this.getUserIds(userPhoneNumbers);
        const feedbackAdmins = await prisma.feedbackAdmins.findMany({
            where: {
                idAdmin: {
                    in: userIds.map(user => user.id)
                }
            },
            include: {
                admin: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        const feedbackUsers = await prisma.feedbackUsers.findMany({
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

        if (feedbackAdmins.length === 0 && feedbackUsers.length === 0) {
            return "No feedback available.";
        }

        const feedbacks = [...feedbackAdmins, ...feedbackUsers];
        let feedbackNumber = 1;
        
        return feedbacks.map((feedback) => (
            `📝 *Feedback #${feedbackNumber++}*\n` +
            `👤 *Name:* ${feedback.admin ? feedback.admin.name : feedback.user.name}\n` +
            `📱 *Phone:* ${feedback.admin ? feedback.admin.numberPhone.replace('@c.us', '') : feedback.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${feedback.feedback}\n`
        )).join('\n');
    }
}

module.exports = { feedBack };