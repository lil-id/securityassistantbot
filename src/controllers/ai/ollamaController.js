const { ollamaModel } = require("../../models/ai/ollamaModel");


async function handleAddAICommand(client, message, args) {
    const content = args.join(" ");
    await message.reply("Asking AI...");
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

module.exports = { handleAddAICommand };