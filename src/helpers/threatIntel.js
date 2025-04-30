const { abuseIpDBCheck } = require("./abuseipdb/abuseCheck");
const { threatFoxCheck } = require("./threatfox/threatFox");

/**
 * Cek IP di ThreatFox & AbuseIPDB
 * @param {string} ip
 * @returns {{
 *   confidence: number | null,
 *   sources: string[],
 *   error: boolean,
 *   abuseRaw?: any,
 *   threatFoxRaw?: any
 * }}
 */
async function checkThreatIntel(ip) {
    let abuseResult = null;
    let threatResult = null;
    let error = false;
    const sources = [];

    try {
        abuseResult = await abuseIpDBCheck(ip);

        if (
            !abuseResult ||
            (abuseResult?.data === null &&
                abuseResult?.errors?.[0]?.status === 429)
        ) {
            error = true;
        } else if (abuseResult?.data) {
            sources.push("AbuseIP DB");
        }
    } catch (err) {
        error = true;
    }

    try {
        threatResult = await threatFoxCheck(ip);
        if (threatResult) {
            sources.push("ThreatFox");
        }
    } catch (err) {
        error = true;
    }

    const confidence =
        threatResult?.confidence_level ??
        abuseResult?.data?.abuseConfidenceScore ??
        null;

    return {
        confidence,
        sources,
        error,
        abuseRaw: abuseResult,
        threatFoxRaw: threatResult,
    };
}

module.exports = { checkThreatIntel };
