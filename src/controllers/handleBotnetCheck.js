const fs = require("fs");
const path = require("path");
const logger = require("../helpers/logger");
const axios = require("axios");
require("dotenv").config();

const THREAT_FEED_URL = process.env.THREAT_FEED_URL;
const BLOCKLIST_FILE = path.join(__dirname, "../public/malicious_ips.txt");

async function handleBotnetCheck(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Fetching latest malicious IPs botnet...");
        const response = await axios.get(THREAT_FEED_URL);

        if (response.data.length === 0) {
            await message.reply("Currently no malicious IPs botnet found from feodotracker.abuse.ch");
            return;
        }

        const maliciousIPs = response.data.map(
            (ip) =>
                `🚨 *IP Address*: ${ip.ip_address}\n🔌 *Port*: ${ip.port}\n📶 *Status*: ${ip.status}\n🏠 *Hostname*: ${ip.hostname}\n🏢 *AS Number*: ${ip.as_number}\n🏢 *AS Name*: ${ip.as_name}\n🌍 *Country*: ${ip.country}\n🕒 *First Seen*: ${ip.first_seen}\n🕒 *Last Online*: ${ip.last_online}\n💀 *Malware*: ${ip.malware}\n`
        ).join("\n");

        await message.reply(`Malicious IPs Botnet List:\n\n${maliciousIPs}`);
    } catch (error) {
        logger.error("Error in handleBotnetCheck:", error);
        await message.reply("Error checking malicious IP botnet");
    }
}

async function fetchAndCompareIPs(client, message) {
    try {
        logger.info("Fetching latest malicious IPs botnet...");
        const response = await axios.get(THREAT_FEED_URL);

        if (response.data.length === 0) {
            logger.info("Currently no malicious IPs botnet found from feodotracker.abuse.ch");
            return;
        }

        const newIPs = response.data.map(ip => ip.ip_address);
        let oldIPs = [];

        if (fs.existsSync(BLOCKLIST_FILE)) {
            oldIPs = JSON.parse(fs.readFileSync(BLOCKLIST_FILE, "utf-8"));
        }

        const newMaliciousIPs = newIPs.filter(ip => !oldIPs.includes(ip));

        if (newMaliciousIPs.length > 0) {
            fs.writeFileSync(BLOCKLIST_FILE, JSON.stringify(newIPs, null, 2));
            const maliciousIPs = response.data
                .filter(ip => newMaliciousIPs.includes(ip.ip_address))
                .map(
                    (ip) =>
                        `🚨 *IP Address*: ${ip.ip_address}\n🔌 *Port*: ${ip.port}\n📶 *Status*: ${ip.status}\n🏠 *Hostname*: ${ip.hostname}\n🏢 *AS Number*: ${ip.as_number}\n🏢 *AS Name*: ${ip.as_name}\n🌍 *Country*: ${ip.country}\n🕒 *First Seen*: ${ip.first_seen}\n🕒 *Last Online*: ${ip.last_online}\n💀 *Malware*: ${ip.malware}\n`
                ).join("\n");

            await client.sendMessage(message.from, `New Malicious IPs Botnet List:\n\n${maliciousIPs}`);
        } else {
            logger.info("No new malicious IPs found.");
        }
    } catch (error) {
        logger.error("Error in fetchAndCompareIPs:", error);
    }
}

function startBotnetCheck(client, message, interval = 5 * 60 * 1000) {
    fetchAndCompareIPs(client, message); // Initial check
    setInterval(() => fetchAndCompareIPs(client, message), interval);
}

module.exports = { handleBotnetCheck, startBotnetCheck };