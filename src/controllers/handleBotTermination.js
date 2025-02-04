const { checkRoles } = require("../helpers/rolesChecker");
const { responseMessages } = require('../views/responseMessage');

async function handleBotTermination(client, message, args) {
    const getRole = await checkRoles(message.author);

    if (getRole && getRole.role === 'admin') {
        await message.reply(responseMessages.botTerminated);
        await client.logout();
        process.exit(0);
    } else {
        await message.reply(responseMessages.noPermission);
    }
}

module.exports = { handleBotTermination };