const logger = require("../helpers/logger");
const axios = require("axios");

const THREAT_FEED_URL =
    "https://feodotracker.abuse.ch/downloads/ipblocklist_recommended.json";

async function handleBotnetCheck(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Fetching latest malicious IPs botnet...");
        const response = await axios.get(THREAT_FEED_URL);
        const maliciousIPs = response.data
            .map(
                (ip) =>
                    `🚨 *IP Address*: ${ip.ip_address}\n🔌 *Port*: ${ip.port}\n📶 *Status*: ${ip.status}\n🏠 *Hostname*: ${ip.hostname}\n🏢 *AS Number*: ${ip.as_number}\n🏢 *AS Name*: ${ip.as_name}\n🌍 *Country*: ${ip.country}\n🕒 *First Seen*: ${ip.first_seen}\n🕒 *Last Online*: ${ip.last_online}\n💀 *Malware*: ${ip.malware}\n`
            )
            .join("\n");

        await message.reply(`Malicious IPs Botnet List:\n\n${maliciousIPs}`
        );
    } catch (error) {
        logger.error("Error in handleBotnetCheck:", error);
        await message.reply("Error checking malicious IP botnet");
    }
}

module.exports = { handleBotnetCheck };
