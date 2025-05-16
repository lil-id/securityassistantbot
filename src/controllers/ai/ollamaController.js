const { ollamaModel } = require("../../models/ai/ollamaModel");
const logger = require("../../helpers/logger");

async function handleAddAICommand(client, message, args) {

    const isRunning = await ollamaModel.isServerRunning();
    const content = args.join(" ");
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    let prompt =
    `"Act as a senior SOC analyst. Given the following security alert from Wazuh, analyze the potential threat, determine its severity, and recommend remediation steps. Provide your reasoning based on best SOC practices."\n`;

    if (!isRunning) {
        try {
            logger.info("AI server is not running.");
            await message.reply("AI server is not running.");
            return res.status(503).send("AI server is not running.");
        } catch (error) {
            logger.error("handleAddAICommand:", error);
            await message.reply("Error in AI server communication.");
        }
    }

    if (content.length === 0) {
        message.reply(
            `Please provide argument text.\n\n\`!ask default\` - Using default prompt\n\`!ask <your question>\` - Ask with your custom question \n\n🧬 Default Prompt:\n${prompt}\n ✅ Example:\n\`!ask default\`\n\n\`!ask what is infostealer malware? explain to me\`\n`
        );
        return;
    } else if (content === "default") {
        logger.info("Asking AI...");
        logger.info("This may take 3-5 minutes...");
        const quotedMsg = message._data.quotedMsg?.body || "";

        let replyMessage = "*Using default prompt*:\n\n" + prompt;
        if (quotedMsg) {
            replyMessage += "\n*Selected message*:\n\n" + quotedMsg;
        }

        await message.reply(replyMessage);
        await message.reply("Asking AI...\n\nThis may take 3-5 minutes...");

        const selectionChat = prompt + quotedMsg;
        const response = await ollamaModel.sendPrompt(selectionChat);
        await message.reply(response);
    } else if (content !== "default") {
        logger.info("Asking AI...");
        logger.info("This may take 3-5 minutes...");
        const quotedMsg = message._data.quotedMsg?.body || "";

        let replyMessage = `*Using prompt*:\n\n"${content}"`;
        if (quotedMsg) {
            replyMessage += "\n\n*Selected message*:\n\n" + quotedMsg;
        }
        
        await message.reply(replyMessage);
        await message.reply("Asking AI...\n\nThis may take 3-5 minutes...");

        const selectionChat = content + quotedMsg;
        const response = await ollamaModel.sendPrompt(selectionChat);
        await message.reply(response);
    } else {
        message.reply(
            `Please provide argument text.\n\n\`!ask default\` - Using default prompt\n\`!ask <your question>\` - Ask with your custom question \n\n🧬 Default Prompt:\n${prompt}\n ✅ Example:\n\`!ask default\`\n\n\`!ask what is infostealer malware? explain to me\`\n`
        );
        return;
    }
}

module.exports = { handleAddAICommand };
