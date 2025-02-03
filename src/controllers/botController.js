const { botAdmins } = require('../models/admins/adminModel');
const { responseMessages } = require('../views/responseMessage');

async function handleBotTermination(message, args) {
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