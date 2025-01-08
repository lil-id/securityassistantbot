const prisma = require('../helpers/databaseConnection');

class feedBack {
    // constructor(id, idUser, feedback) {
    //     this.id = id;
    //     this.idUser = idUser;
    //     this.feedback = feedback;
    // }

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

    static async createFeedback(sender, feedback) {
        const userId = await this.getUserId(sender);
        await prisma.feedbacks.create({
            data: {
                idUser: userId,
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

    static async getFeedbackById(userPhoneNumber) {
        const userId = await this.getUserId(userPhoneNumber);
        const feedback = await prisma.feedbacks.findMany({
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

        if (feedback.length === 0) {
            return "No feedback available.";
        }
        
        return feedback.map((feedback) => (
            `📝 *Feedback #${feedback.id}*\n` +
            `👤 *Name:* ${feedback.user.name}\n` +
            `📱 *Phone:* ${feedback.user.numberPhone.replace('@c.us', '')}\n` +
            `💬 *Message:* ${feedback.feedback}\n`
        )).join('\n');
    }
}

module.exports = { feedBack };
