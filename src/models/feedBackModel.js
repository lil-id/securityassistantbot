const prisma = require('../helpers/databaseConnection');

async function createFeedback(sender, feedback) {

    const userPhoneNumber = await prisma.users.findUnique({
        where: {
          numberPhone: sender
        },
        select: {
            id: true,
        }
    });

    await prisma.feedbacks.create({
        data: {
            idUser: userPhoneNumber.id,
            feedback: feedback,
        }
    });

    return;
}

module.exports = {
    createFeedback
};
