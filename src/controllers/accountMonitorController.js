const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { getAllAccounts } = require("../models/accountMonitor");
const { formatAccountInfo } = require("../helpers/accountFormatter");
const logger = require("../helpers/logger");

const SUSPICIOUS_ACCOUNTS_FILE = path.join(__dirname, "../public/suspiciousSystemAccount.txt");

async function handleAccountCheck(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Running system account script...");
        execSync("sh src/scripts/systemAccount.sh", { stdio: "ignore" });

        const accounts = getAllAccounts();
        const suspiciousAccounts = accounts.filter(account => account.isSuspicious);

        if (suspiciousAccounts.length === 0) {
            await message.reply("✅ No suspicious accounts detected.");
            return;
        }

        const reportMessage = `🚨 *Suspicious System Accounts Report*\n\n` +
            suspiciousAccounts.map(account => formatAccountInfo(account)).join("\n\n");
        await message.reply(reportMessage);
    } catch (error) {
        logger.error("Error generating report:", error);
        await message.reply("⚠️ Error: Failed to generate system account report.");
    }
}

async function fetchAccountCheck(client, groups) {
    try {
        logger.info("Running system account script...");
        execSync("sh src/scripts/systemAccount.sh", { stdio: "ignore" });

        const accounts = getAllAccounts();
        const suspiciousAccounts = accounts.filter(account => account.isSuspicious);

        if (suspiciousAccounts.length === 0) {
            logger.info("No suspicious accounts detected.");
            return;
        }

        let previousSuspiciousAccounts = [];
        if (fs.existsSync(SUSPICIOUS_ACCOUNTS_FILE)) {
            const fileContent = fs.readFileSync(SUSPICIOUS_ACCOUNTS_FILE, "utf-8").trim();
            if (fileContent) {
                previousSuspiciousAccounts = JSON.parse(fileContent);
            }
        }

        if (JSON.stringify(suspiciousAccounts) === JSON.stringify(previousSuspiciousAccounts)) {
            logger.info("No new suspicious accounts detected.");
            return;
        }

        fs.writeFileSync(SUSPICIOUS_ACCOUNTS_FILE, JSON.stringify(suspiciousAccounts, null, 2));

        const reportMessage = `🚨 *Suspicious System Accounts Report*\n\n` +
            suspiciousAccounts.map(account => formatAccountInfo(account)).join("\n\n");

        await client.sendMessage(groups.alertTrigger, reportMessage);
    } catch (error) {
        logger.error("Error generating report:", error);
    }
}

function startAccountCheck(client, groups, interval = 5 * 60 * 1000) {
    fetchAccountCheck(client, groups); // Initial check
    setInterval(() => fetchAccountCheck(client, groups), interval);
}

module.exports = { handleAccountCheck, startAccountCheck };