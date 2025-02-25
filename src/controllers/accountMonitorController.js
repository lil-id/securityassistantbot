const {
    startAccountMonitoring,
    stopAccountMonitoring,
    getAccountDetails,
    checkAccountChanges,
} = require("../models/accountMonitor");
const { formatAccountInfo } = require("../helpers/accountFormatter");
const logger = require("../helpers/logger");

async function handleAccountCheck(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        const accounts = await getAccountDetails();
        const changes = await checkAccountChanges(accounts);

        let response = "📊 *Account Status Report*\n\n";

        // Report new accounts
        if (changes.added.length > 0) {
            response += "🆕 *New Accounts:*\n";
            changes.added.forEach((account) => {
                response += formatAccountInfo(account) + "\n";
            });
        }

        // Report suspicious accounts
        if (changes.suspicious.length > 0) {
            response += "⚠️ *Suspicious Accounts:*\n";
            changes.suspicious.forEach((account) => {
                response += formatAccountInfo(account) + "\n";
            });
        }

        // Report removed accounts
        if (changes.removed.length > 0) {
            response += "❌ *Removed Accounts:*\n";
            changes.removed.forEach((account) => {
                response += `- ${account.username}\n`;
            });
        }

        // If no changes, show summary
        if (
            !changes.added.length &&
            !changes.removed.length &&
            !changes.suspicious.length
        ) {
            response += "✅ No suspicious activity detected\n\n";
            response += `Total Accounts: ${accounts.size}\n`;
            response += `System Accounts: ${
                [...accounts.values()].filter((a) => a.uid < 1000).length
            }\n`;
            response += `User Accounts: ${
                [...accounts.values()].filter((a) => a.uid >= 1000).length
            }\n`;
        }

        await message.reply(response);

        // Send detailed report to admin if suspicious activity found
        if (changes.suspicious.length > 0 && message.from !== message.from) {
            const adminAlert =
                "🚨 *Suspicious Account Activity Detected*\n\n" +
                changes.suspicious.map(formatAccountInfo).join("\n");
            logger.info(message.from, adminAlert);
            await client.sendMessage(message.from, adminAlert);
        }
    } catch (error) {
        logger.error("Error in handleAccountCheck:", error);
        await message.reply("Error checking account status");
    }
}

async function handleAccountMonitorCommand(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        if (!args.length) {
            await message.reply(
                "Usage:\n" +
                    "!accmon start [interval] - Start account monitoring (interval in minutes, default 15)\n" +
                    "!accmon stop - Stop account monitoring"
            );
            return;
        }

        const action = args[0].toLowerCase();
        if (action === "start") {
            const interval = args[1]
                ? parseInt(args[1]) * 60 * 1000
                : undefined;
            startAccountMonitoring(client, message.from, interval);
            await message.reply(
                `Account monitoring started. Interval: ${
                    interval ? interval / 60000 : 15
                } minutes`
            );
        } else if (action === "stop") {
            stopAccountMonitoring();
            await message.reply("Account monitoring stopped");
        }
    } catch (error) {
        logger.error("Error in handleAccountMonitorCommand:", error);
        await message.reply("Error monitoring accounts");
    }
}

module.exports = { handleAccountMonitorCommand, handleAccountCheck };
