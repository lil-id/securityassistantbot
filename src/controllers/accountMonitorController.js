const { execSync } = require("child_process");
const { getAllAccounts } = require("../models/accountMonitor");
const { formatAccountInfo } = require("../helpers/accountFormatter");
const logger = require("../helpers/logger");


async function handleAccountCheck (client, message, args) {
  try {
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    logger.info("Running system account script...");
    execSync("bash src/scripts/systemAccount.sh", { stdio: "ignore" });

    const accounts = getAllAccounts();
    const suspiciousAccounts = accounts.filter(account => account.isSuspicious);

    if (suspiciousAccounts.length === 0) {
      return "✅ No suspicious accounts detected.";
    }

    const reportMessage = `🚨 *Suspicious System Accounts Report*\n\n` +
      suspiciousAccounts.map(account => formatAccountInfo(account)).join("\n\n");
    
    message.reply(reportMessage);

    return reportMessage;
  } catch (error) {
    logger.error("Error generating report:", error);
    return "⚠️ Error: Failed to generate system account report.";
  }
};

module.exports = { handleAccountCheck };
