const logger = require("../logger");
const axios = require("axios");

require("dotenv").config();

async function abuseIpDBCheck(ip, retries = 3) {
    logger.info(`Checking threat intelligence for IP: ${ip}`);
    try {
        const response = await axios.get(
            `${process.env.ABUSEIPDB_API_URL}/check?ipAddress=${ip}`,
            {
                headers: { Key: process.env.ABUSEIPDB_API_KEY },
                timeout: 5000,
                signal: AbortSignal.timeout(5000),
            }
        );
        const confidenceScore = response.data.data.abuseConfidenceScore;
        return {
            isMalicious: confidenceScore >= 50,
            data: response.data.data,
        };
    } catch (error) {
        if (error.code === "ETIMEDOUT" && retries > 0) {
            logger.warn(
                `Timeout occurred. Retrying... (${retries} retries left)`
            );
            return abuseIpDBCheck(ip, retries - 1);
        }
        logger.error("Threat intelligence check failed", error);
        return { isMalicious: false, data: null };
    }
}

module.exports = { abuseIpDBCheck };