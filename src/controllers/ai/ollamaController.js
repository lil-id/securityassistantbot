const { ollamaModel } = require("../../models/ai/ollamaModel");
const logger = require("../../helpers/logger");

async function handleAddAICommand(client, message, args) {
    const content = args.join(" ");
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        await message.reply("AI server is not running.");
        return;
    }

    logger.info("Asking AI...");
    await message.reply("Asking AI...");
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

module.exports = { handleAddAICommand };