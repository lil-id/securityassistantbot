const logger = require('../helpers/logger');
const { checkRoles } = require('../helpers/rolesChecker');

async function handleHelp(client, message, args) {
    logger.info("Help command requested.");
    const getRole = await checkRoles(message.author);
    let helpMessage = "Available commands.\n\n";

    if (getRole && getRole.role === "admin") {
        helpMessage += "*Admin Commands*:\n";
        helpMessage += "!ask - Ask question to AI\n";
        helpMessage += "!admin - Added new admin\n";
        helpMessage += "!user - Added new member\n";
        helpMessage += "!server - Check server status\n";
        // helpMessage += "!monitor - Start monitoring server\n";
        // helpMessage += "!threshold - Configure threshold\n";
        helpMessage += "!account - Check server accounts\n";
        helpMessage += "!container - Check container status\n";
        helpMessage += "!snap - Create snapshot\n";
        helpMessage += "!response - View active response summary\n";
        helpMessage += "!feedback - View all feedback\n";
        helpMessage += "!report - View all issues\n";
        helpMessage += "!help - Show this help message\n";
        helpMessage += "!info - Get bot information\n";
        helpMessage += "!stop - Terminate bot\n";

        await message.reply(helpMessage);
        return;
    }

    helpMessage += "*User Commands*:\n";
    helpMessage += "!server - Check server status\n";
    helpMessage += "!account - Check server accounts\n";
    helpMessage += "!container - Check container status\n";
    helpMessage += "!snap - Create snapshot\n";
    helpMessage += "!response - View active response summary\n";
    helpMessage += "!feedback - Create feedback\n";
    helpMessage += "!report - Report issues\n";
    helpMessage += "!help - Show this help message\n";
    helpMessage += "!info - Get bot information\n";

    await message.reply(helpMessage);
    return;
}

module.exports = { handleHelp };