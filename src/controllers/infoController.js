const logger = require("../helpers/logger");

async function handleInfo(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Morning Star (Monsta) v1.0");
        await message.reply("Morning Star (Monsta) v1.0\nCreated by lil-id");
    } catch (error) {
        logger.error("Error getting info:", error);
        message.reply(`Error: ${error.message}`);
        
    }
}

module.exports = { handleInfo };
