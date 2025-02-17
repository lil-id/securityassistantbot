const { ollamaModel } = require("../../models/ai/ollamaModel");
const { Router } = require('express');
const logger = require("../../helpers/logger");

const ollamaRouter = Router();

async function handleAddAICommand(client, message, args) {
    const content = args.join(" ");
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        await message.reply("AI server is not running.");
        return res.status(503).send("AI server is not running.");;
    }

    logger.info("Asking AI...");
    await message.reply("Asking AI...");
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

async function handleSecurityRecommendation(req, res) {
    const { fullLogs } = req.body;
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        return res.status(503).send("AI server is not running.");
    }

    logger.info("Asking AI for security recommendation...");
    const response = await ollamaModel.sendPrompt(`Provide security recommendations based on the following logs:\n${fullLogs}`);
    console.log(response);
    res.send(response);
}

module.exports = { handleAddAICommand, handleSecurityRecommendation };