const logger = require("../helpers/logger");
const { checkRoles } = require("../helpers/rolesChecker");
const { responseMessages } = require('../views/responseMessage');

async function handleBotTermination(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();
        
        const getRole = await checkRoles(message.author);

        if (getRole && getRole.role === 'admin') {
            logger.info('Bot termination requested by admin.');
            await message.reply(responseMessages.botTerminated);
            await client.logout();
            process.exit(0);
        } else {
            logger.warn('Bot termination requested by non-admin.');
            await message.reply(responseMessages.noPermission);
        }
    } catch (error) {
        logger.error("Error in handleBotTermination:", error);
        await message.reply("Error terminating bot");
        
    }
}

module.exports = { handleBotTermination };