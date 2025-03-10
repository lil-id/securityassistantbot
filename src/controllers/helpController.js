const logger = require("../helpers/logger");
const { checkRoles } = require("../helpers/rolesChecker");
const {
    adminHelpMessage,
    userHelpMessage,
} = require("../views/responseMessage");

async function handleHelp(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();
        logger.info("Help command requested.");
        const getRole = await checkRoles(message.author);

        if (getRole && getRole.role === "admin") {
            await message.reply(adminHelpMessage);
            const chatInstance = await message.getChat();
            if (!chatInstance) {
                return;
            }
            await chatInstance.pin();
            return;
        }
        await message.reply(userHelpMessage);
        const chatInstance = await message.getChat();

        if (!chatInstance) {
            return;
        }
        await chatInstance.pin();
        return;
    } catch (error) {
        logger.error("Error in handleHelp:", error);
    }
}

module.exports = { handleHelp };
