const { commandHistory } = require("../models/commandHistory");
const { MessageMedia } = require("whatsapp-web.js");
const path = require("path");
const fs = require("fs");
const logger = require("../helpers/logger");

async function convertActivityLog(logs) {
    if (logs.length === 0) {
        return "No logs found";
    }

    const formattedLog = logs
        .map(
            (entry) =>
                `ID: ${entry.id}\nName: ${entry.name}\nActivity: ${entry.activity}\nCreated At: ${entry.createdAt}\n\n`
        )
        .join("");

    return formattedLog;
}

async function handleCommandHistory(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();
        const [userType, action] = args.join(" ").split(" ");
        
        if (userType === "") {
            await message.reply("Please provide argument text.\n\n`!history admin` or\n`!history user`");
            return;
        } else if (userType === "admin" && action === undefined) {
            logger.info("Fetching admin command history...");
            const adminCommands = await commandHistory.getCommandAdminHistory();
            // Convert log data to text format
            const textContent = await convertActivityLog(adminCommands);
            // Save it to .txt files
            const BLOCKLIST_FILE = path.join(
                __dirname,
                "../public/adminCommand.txt"
            );
            fs.writeFileSync(BLOCKLIST_FILE, textContent);
            const media = MessageMedia.fromFilePath(BLOCKLIST_FILE);
            await message.reply(media);
        } else if (userType === "user" && action === undefined) {
            const userCommands = await commandHistory.getCommandUserHistory();
            logger.info("Fetching user command history...");
            // Convert log data to text format
            const textContent = await convertActivityLog(userCommands);
            // Save it to .txt files
            const BLOCKLIST_FILE = path.join(
                __dirname,
                "../public/userCommand.txt"
            );
            fs.writeFileSync(BLOCKLIST_FILE, textContent);
            const media = MessageMedia.fromFilePath(BLOCKLIST_FILE);
            await message.reply(media);
        } else if (userType === "admin" && action === "analyze") {
            await commandHistory.analayzeCommandHistory(message, userType);
        } else {
            await commandHistory.analayzeCommandHistory(message, userType);
        }
    } catch (error) {
        logger.error("Error in handleCommandHistory");
    }
}

module.exports = { handleCommandHistory };
