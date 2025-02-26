const { ollamaModel } = require("../../models/ai/ollamaModel");
const logger = require("../../helpers/logger");

async function handleAddAICommand(client, message, args) {
    const content = args.join(" ");
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        await message.reply("AI server is not running.");
        return res.status(503).send("AI server is not running.");;
    }

    logger.info("Asking AI...");
    logger.info("This may take 2-3 minutes...");
    await message.reply("Asking AI...");
    await message.reply("This may take 2-3 minutes...");
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

async function handleSecurityRecommendation(req, res) {
    const { body } = req.body;
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        return res.status(503).send({code: 503, message: "AI server is not running."});
    }

    logger.info("Asking AI for security recommendation...");
    const response = await ollamaModel.sendPrompt(`Provide security recommendations based on the following logs:\n${body}`);
    console.log(response);
    res.send(response);
}

module.exports = { handleAddAICommand, handleSecurityRecommendation };