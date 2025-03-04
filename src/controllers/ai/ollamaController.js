const { ollamaModel } = require("../../models/ai/ollamaModel");
const logger = require("../../helpers/logger");

async function handleAddAICommand(client, message, args) {
    const isRunning = await ollamaModel.isServerRunning();
    const content = args.join(" ");
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    if (!isRunning) {
        try {
            logger.info("AI server is not running.");
            await message.reply("AI server is not running.");
            return res.status(503).send("AI server is not running.");
        } catch (error) {
            logger.error("Error in handleAddAICommand:", error);
            await message.reply("Error in handleAddAICommand");
        }
    }

    // if (content.length === 0) {
    //     await message.reply(
    //         "Please *select security alert* to get security recommendation and type \n!ask"
    //     );
    //     await message.reply(
    //         "or provide argument text for custom question.\n\nExample: \n\n*!ask why sky is blue?*"
    //     );
    //     return;
    // }

    let prompt =
        "Act as a senior SOC analyst. Given the following security alert from Wazuh, analyze the potential threat, determine its severity, and recommend remediation steps. Provide your reasoning based on best SOC practices.\n\n";

    logger.info("Asking AI...");
    logger.info("This may take 3-5 minutes...");
    await message.reply("Asking AI...\n\nThis may take 3-5 minutes...");

    if (args.length === 0) {
        const quotedMsg = await message._data.quotedMsg.body;
        const selectionChat = prompt + quotedMsg;
        const response = await ollamaModel.sendPrompt(selectionChat);
        await message.reply(response);
        return;
    }
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

async function handleSecurityRecommendation(req, res) {
    const { body } = req.body;
    const isRunning = await ollamaModel.isServerRunning();

    if (!isRunning) {
        logger.info("AI server is not running.");
        return res
            .status(503)
            .send({ code: 503, message: "AI server is not running." });
    }

    logger.info("Asking AI for security recommendation...");
    const response = await ollamaModel.sendPrompt(
        `Provide security recommendations based on the following logs:\n${body}`
    );
    console.log(response);
    res.send(response);
}

module.exports = { handleAddAICommand, handleSecurityRecommendation };
