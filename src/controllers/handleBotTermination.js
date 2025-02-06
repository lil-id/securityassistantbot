const logger = require("../helpers/logger");
const { checkRoles } = require("../helpers/rolesChecker");
const { responseMessages } = require('../views/responseMessage');

async function handleBotTermination(client, message, args) {
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
}

module.exports = { handleBotTermination };