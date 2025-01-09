const prisma = require('../helpers/databaseConnection');

class feedBack {
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

    static async createFeedback(sender, feedback) {
        const userId = await this.getUserIds(sender);
        await prisma.feedbacks.create({
            data: {
                idUser: userId.id,
                name: userId.name,
                feedback: feedback,
            }
        });
        return;
    }

    static async getFeedbacks() {
        const feedbacks = await prisma.feedbacks.findMany({
            include: {
                user: {
                    select: {
                        name: true,
                        numberPhone: true
                    }
                }
            }
        });

        if (feedbacks.length === 0) {
            return "No feedback available.";
        }

        return feedbacks.map((feedback) => (
            `📝 *Feedback #${feedback.id}*\n` +
            `👤 *Name:* ${feedback.user.name}\n` +
            `📱 *Phone:* ${feedback.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${feedback.feedback}\n`
        )).join('\n');
    }

    static async getFeedbackById(userPhoneNumbers) {
        const userIds = await this.getUserIds(userPhoneNumbers);
        const feedbacks = await prisma.feedbacks.findMany({
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

        if (feedbacks.length === 0) {
            return "No feedback available.";
        }
        
        return feedbacks.map((feedback) => (
            `📝 *Feedback #${feedback.id}*\n` +
            `👤 *Name:* ${feedback.user.name}\n` +
            `📱 *Phone:* ${feedback.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${feedback.feedback}\n`
        )).join('\n');
    }
}

module.exports = { feedBack };
