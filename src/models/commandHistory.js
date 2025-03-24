const { prisma } = require("../helpers/databaseConnection");
const logger = require("../helpers/logger");
const { ollamaModel } = require("./ai/ollamaModel");

class commandHistory {
    static async getCommandAdminHistory() {
        logger.info("Getting admin history command");
        const historyCommandAdmin = await prisma.adminActivitylogs.findMany({
            select: {
                id: true,
                name: true,
                activity: true,
                createdAt: true,
            },
        });

        return historyCommandAdmin;
    }

    static async getCommandUserHistory() {
        logger.info("Getting user history command");
        const historyCommandUser = await prisma.userActivitylogs.findMany({
            select: {
                id: true,
                name: true,
                activity: true,
                createdAt: true,
            },
        });

        return historyCommandUser;
    }

    static async analayzeCommandHistory(message, userType) {
        const prompt = `
Analyze the following command history logs and detect any anomalies or suspicious activities that may indicate potential reconnaissance, unauthorized access, or insider threats.

Instructions:
- Identify repetitive or excessive command usage within short time intervals.
- Highlight any deviations from typical usage patterns.
- Look for potential reconnaissance attempts, such as frequent queries on admin history.
- Identify sequences that may indicate privilege escalation or abuse of admin functions.
- Classify risk levels (low, medium, high) for each detected anomaly.
            \n\n`;

        if (userType === "admin") {
            logger.info("Analyzing admin command history...");
            const fetchAdminHistory = await prisma.adminActivitylogs.findMany({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });
            const formattedHistory = JSON.stringify(fetchAdminHistory, null, 2); // Converts array to a readable string
            const mergePrompt = `${prompt}${formattedHistory}`;
            logger.info("Asking AI...");
            logger.info("This may take 10 minutes or more...");
            await message.reply(
                "Asking AI...\n\nThis may take 10 minutes or more..."
            );
            const response = await ollamaModel.sendPrompt(mergePrompt);
            message.reply(response);
        } else if (userType === "user") {
            logger.info("Analyzing user command history...");
            const fetchUserHistory = await prisma.userActivitylogs.findMany({
                select: {
                    id: true,
                    name: true,
                    activity: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            });
            const formattedHistory = JSON.stringify(fetchUserHistory, null, 2); // Converts array to a readable string
            const mergePrompt = `${prompt}${formattedHistory}`;
            logger.info("Asking AI...");
            logger.info("This may take 10 minutes or more...");
            await message.reply(
                "Asking AI...\n\nThis may take 10 minutes or more..."
            );
            const response = await ollamaModel.sendPrompt(mergePrompt);
            message.reply(response);
        }
    }
}

module.exports = { commandHistory };
