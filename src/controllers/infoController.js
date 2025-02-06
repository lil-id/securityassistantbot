const logger = require("../helpers/logger");

async function handleInfo(client, message, args) {
    logger.info("Bot Security (Boty) v1.0");
    await message.reply("Bot Security (Boty) v1.0\nCreated by lil-id");
}

module.exports = { handleInfo };