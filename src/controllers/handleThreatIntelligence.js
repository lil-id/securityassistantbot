const axios = require("axios");
const logger = require("../helpers/logger");
require("dotenv").config();

async function fetchLatestThreats(client, message, args) {
    logger.info("Fetching latest ThreatFox data...");
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();
    const commandOption = args.join(" ");

    if (commandOption !== "") {
        const threat = await lookupThreat(commandOption);
        if (threat) {
            const formattedThreat = `
🔍 *IoC*: \`${threat.ioc}\`
📋 *Type*: ${threat.threat_type_desc || "N/A"}
🌐 *IOC Type*: ${threat.ioc_type_desc || "N/A"}
☣️ *Malware Name*: ${threat.malware_printable || "N/A"}
🔖 *Tags*: ${threat.tags && threat.tags.length > 0 ? threat.tags.map(tag => `#${tag}`).join(", ") : "N/A"}
🎯 *Confidence Level*: (${threat.confidence_level || "N/A"}%)
👤 *Reporter*: ${threat.reporter || "N/A"}
🕒 *First Seen*: ${threat.first_seen || "N/A"}
🕵️‍♂️ *More Details*: ${threat.malware_malpedia || "N/A"}`;
            await message.reply(formattedThreat);
        } else {
            await message.reply("No information found for that IOC");
        }
        return;
    }

    try {
        const requestData = { query: "get_iocs", days: 7 };
        const response = await axios.post(
            `${process.env.THREATFOX_API_URL}/api/v1/`,
            requestData,
            {
                headers: { "Auth-Key": `${process.env.THREATFOX_AUTH_KEY}` },
            }
        );

        if (response.data.query_status === "ok") {
            await message.reply(
                "Latest ThreatFox data:\n\n" +
                    response.data.data
                        .slice(0, 5)
                        .map(
                            (threat) => `
🔍 *IoC*: \`${threat.ioc}\`
📋 *Type*: ${threat.threat_type_desc || "N/A"}
🌐 *IOC Type*: ${threat.ioc_type_desc || "N/A"}
☣️ *Malware Name*: ${threat.malware_printable || "N/A"}
🔖 *Tags*: ${threat.tags && threat.tags.length > 0 ? threat.tags.map(tag => `#${tag}`).join(", ") : "N/A"}
🎯 *Confidence Level*: (${threat.confidence_level || "N/A"}%)
👤 *Reporter*: ${threat.reporter || "N/A"}
🕒 *First Seen*: ${threat.first_seen || "N/A"}
🕵️‍♂️ *More Details*: ${threat.malware_malpedia || "N/A"}
                            `
                        )
                        .join("\n")
            );
        } else {
            await message.reply("Failed to fetch ThreatFox data.");
        }
    } catch (error) {
        logger.error("Error fetching ThreatFox data", error);
        await message.reply("Error fetching ThreatFox data. Please try again later.");
    }
}

async function lookupThreat(ioc) {
    logger.info(`Looking up ThreatFox IOC: ${ioc}`);
    const requestData = {
        query: "search_ioc",
        search_term: ioc,
    };

    try {
        const response = await axios.post(
            `${process.env.THREATFOX_API_URL}/api/v1/`,
            requestData,
            {
                headers: { "Auth-Key": `${process.env.THREATFOX_AUTH_KEY}` },
            }
        );

        if (
            response.data.query_status === "ok" &&
            response.data.data.length > 0
        ) {
            return response.data.data[0]; // Return first match
        } else {
            return null;
        }
    } catch (error) {
        logger.error(
            "Error looking up ThreatFox IOC:",
            error.response?.data || error.message
        );
        return null;
    }
}

module.exports = { fetchLatestThreats, lookupThreat };