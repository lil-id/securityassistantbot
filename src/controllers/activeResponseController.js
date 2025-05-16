const https = require("https");
const axios = require("axios");
const { Router } = require("express");
const logger = require("../helpers/logger");
const userSession = require("../middleware/usersMiddleware");
const { redisClient } = require("../helpers/redisConnection");
const adminSession = require("../middleware/adminsMiddleware");
const { apiKeyMiddleware } = require("../middleware/wazuhMiddleware");
const {
    reportToAbuseIPDB,
    checkQuotaAbuseIPDB,
} = require("../helpers/abuseipdb/report");
const { isPrivateIP } = require("../helpers/privateIpcheck");
const { abuseIpDBCheck } = require("../helpers/abuseipdb/abuseCheck");
const { checkThreatIntel } = require("../helpers/threatIntel");
const { threatFoxCheck } = require("../helpers/threatfox/threatFox");
require("dotenv").config();

const wazuhRouter = Router();

// Middleware to allow either user or admin session
const allowEitherSession = (req, res, next) => {
    adminSession(req, res, (err) => {
        logger.info("Checking admin session...");
        if (!err) return next(); // Admin passed, move forward

        logger.info("Admin check failed; trying user session...");
        userSession(req, res, (err) => {
            if (!err) return next(); // User passed, move forward

            logger.info("User check failed too.");
            return res.status(401).json({ error: "Unauthorized access" });
        });
    });
};

// Track alerts from the same IP
async function trackAlert(ip) {
    const key = `alert_count:${ip}`;
    let count = await redisClient.get(key);

    if (!count) {
        await redisClient.setEx(key, 3600, "1"); // Set TTL of 10 minutes
        return 1; // First occurrence
    }

    count = (parseInt(count) + 1).toString();
    await redisClient.setEx(key, 3600, count); // Reset TTL on update
    return count;
}

// Store alerts in Redis (TTL: 60 minutes)
async function storeAlert(alert) {
    logger.info("Storing alert in Redis");
    const key = `alerts:${alert.src_ip}`;
    await redisClient.rPush(key, JSON.stringify(alert)); // Push alert to list
    await redisClient.expire(key, 3600); // Set expiry to 60 minutes
}

// Determine if an alert is interesting
async function isInteresting(alert) {
    if (alert.level >= 5) {
        // Always check if the source IP is malicious
        const [abuseIpDBResult, threatFoxResult] = await Promise.all([
            abuseIpDBCheck(alert.src_ip),
            threatFoxCheck(alert.src_ip),
        ]);

        // Check if any source considers the IP malicious
        if (abuseIpDBResult.isMalicious || threatFoxResult) {
            return true;
        }

        return (
            alert.groups.includes("authentication_failed") &&
            alert.groups.includes("invalid_login")
        );
    }
}

// Send alert message to WhatsApp group
async function sendAlertMessage(client, groups, alert) {
    await client.sendMessage(
        groups.announcement,
        `🪪 *ID*: ${alert.id}\n` +
            `🖥️ *Agent*: ${alert.agent}\n` +
            `📝 *Description*: ${alert.description}\n` +
            `🔔 *Rule Level*: ${alert.level}\n` +
            `🕒 *Timestamp*: ${alert.timestamp}\n` +
            `🌐 *Src IP*: ${alert.src_ip}\n` +
            `🏷️ *Groups*: ${alert.groups}\n` +
            `📋 *Full Log*: ${alert.full_log}\n` +
            `🔗 *Link Detail*: ${process.env.LOG_URL}/dashboard?ip=${alert.src_ip}\n`
    );

    await client.sendMessage(
        groups.announcement,
        "Running Threat Intelligence checks..."
    );

    const intel = await checkThreatIntel(alert.src_ip);

    if (intel.sources.length === 0 || intel.confidence === null) {
        const reason = intel.error
            ? `AbuseIPDB or ThreatFox check failed (API error or quota limit).`
            : `This IP is not found in AbuseIP DB or ThreatFox.`;

        await client.sendMessage(
            groups.announcement,
            `No Threat Intelligence Data Found!\n` +
                `🌐 *IP:* ${alert.src_ip}\n` +
                `⚠️ ${reason}`
        );
    } else if (intel.confidence <= 25) {
        await client.sendMessage(
            groups.member,
            `🪪 *ID*: ${alert.id}\n` +
                `🖥️ *Agent*: ${alert.agent}\n` +
                `📝 *Description*: ${alert.description}\n` +
                `🔔 *Rule Level*: ${alert.level}\n` +
                `🕒 *Timestamp*: ${alert.timestamp}\n` +
                `🌐 *Src IP*: ${alert.src_ip}\n` +
                `🏷️ *Groups*: ${alert.groups}\n` +
                `📋 *Full Log*: ${alert.full_log}\n` +
                `🔗 *Link Detail*: ${process.env.LOG_URL}/dashboard?ip=${alert.src_ip}\n`
        );

        await client.sendMessage(
            groups.member,
            `Interesting Alert Detected!\n` +
                `🌐 *IP:* ${alert.src_ip}\n` +
                `🎯 *Confidence Level:* ${intel.confidence}\n` +
                `⚠️ Low Confidence or New IP`
        );
    } else {
        await client.sendMessage(
            groups.announcement,
            `Threat Intelligence Alert!\n` +
                `🌐 *Malicious IP:* ${alert.src_ip}\n` +
                `🕵️‍♂️ *Found at:* ${intel.sources.join(", ")}\n` +
                `🎯 *Confidence Level:* ${intel.confidence}`
        );
    }

    // const getThreatFox = await threatFoxCheck(alert.src_ip);
    // const getAbuseIpDB = await abuseIpDBCheck(alert.src_ip);

    // if (getThreatFox || getAbuseIpDB) {
    //     const foundIn = [
    //         getThreatFox && "ThreatFox",
    //         getAbuseIpDB.data && "AbuseIP DB",
    //     ].filter(Boolean);

    //     const confidenceLevel =
    //         getThreatFox?.confidence_level ??
    //         getAbuseIpDB.data?.abuseConfidenceScore;

    //     if (
    //         foundIn.length === 0 ||
    //         confidenceLevel === null ||
    //         confidenceLevel === undefined
    //     ) {
    //         await client.sendMessage(
    //             groups.announcement,
    //             `No Threat Intelligence Data Found!\n` +
    //                 `🌐 *IP:* ${alert.src_ip}\n` +
    //                 `⚠️ This IP is not found in AbuseIP DB or ThreatFox.`
    //         );
    //     } else if (confidenceLevel <= 25) {
    //         await client.sendMessage(
    //             groups.member,
    //             `🪪 *ID*: ${alert.id}\n` +
    //                 `🖥️ *Agent*: ${alert.agent}\n` +
    //                 `📝 *Description*: ${alert.description}\n` +
    //                 `🔔 *Rule Level*: ${alert.level}\n` +
    //                 `🕒 *Timestamp*: ${alert.timestamp}\n` +
    //                 `🌐 *Src IP*: ${alert.src_ip}\n` +
    //                 `🏷️ *Groups*: ${alert.groups}\n` +
    //                 `📋 *Full Log*: ${alert.full_log}\n` +
    //                 `🔗 *Link Detail*: ${process.env.LOG_URL}/dashboard?ip=${alert.src_ip}\n`
    //         );

    //         await client.sendMessage(
    //             groups.member,
    //             `Interesting Alert Detected!\n` +
    //                 `🌐 *IP:* ${alert.src_ip}\n` +
    //                 `🎯 *Confidence Level:* ${confidenceLevel}\n` +
    //                 `⚠️ This Confidence IP is Low (<= 25) or is not found in AbuseIP DB or ThreatFox.`
    //         );
    //     } else {
    //         await client.sendMessage(
    //             groups.announcement,
    //             `Threat Intelligence Alert!\n` +
    //                 `🌐 *Malicious IP:* ${alert.src_ip}\n` +
    //                 `🕵️‍♂️ *Found at:* ${foundIn.join(", ")}\n` +
    //                 `🎯 *Confidence Level:* ${confidenceLevel}`
    //         );
    //     }
    // } else {
    //     logger.info("No ThreatFox or Abuse IP DB data found for this IP.");
    // }
}

// Handle alert escalation
async function handleAlertEscalation(client, groups, alert) {
    if ((await isInteresting(alert)) || alert.level >= 5) {
        logger.info("🚨 Interesting alert detected! Escalating...");
        await sendAlertMessage(client, groups, alert);
    }
    return null;
}

// Handle alert notification
async function triggerActiveReponseNotification(client, groups, alert, count) {
    if (alert.id !== "000" && alert.rule !== "2904") {
        logger.info(
            `🔄 Alert from ${alert.src_ip} triggered ${count} times. Notifying...`
        );
        await client.sendMessage(
            groups.alertTrigger,
            `🔄 Alert from *${alert.src_ip}* at *${alert.agent}* triggered ${count} times.`
        );

        // const isTrigger = await triggerActiveReponse(alert.id, alert.src_ip);

        // if (isTrigger) {
        //     logger.info(
        //         `🔥 Active response triggered for ${alert.src_ip}.`
        //     );
        //     await client.sendMessage(
        //         groups.alertTrigger,
        //         `🤖 Automatically block for *${alert.src_ip}*`
        //     );
        // }
    } else {
        logger.warn("Invalid alert ID. Skipping active response...");
    }
}

// Process rule 5402 alert with level 3 = This for monitoring commands run as root
async function processRule5402Alert(client, groups, alert) {
    logger.info("Processing rule 5402 alert with level 3...");
    await client.sendMessage(
        groups.member,
        `🪪 *ID*: ${alert.id}\n` +
            `🖥️ *Agent*: ${alert.agent}\n` +
            `🔔 *Rule Level*: ${alert.level}\n` +
            `👤 *Account*: ${alert.account}\n` +
            `📝 *Description*: ${alert.description}\n` +
            `🏷️ *Groups*: ${alert.groups}\n` +
            `📋 *Full Log*: ${alert.full_log}\n`
    );
    await client.sendMessage(
        groups.member,
        `Alert detected! *${alert.account}* executed a command as root.`
    );
}

// Process incoming alert
async function processAlert(alert, client, groups) {
    if (
        !alert?.src_ip ||
        alert.src_ip === "-" ||
        alert.src_ip === "unknown" ||
        isPrivateIP(alert.src_ip)
    ) {
        logger.info(`⛔ Skip alert (invalid IP): ${alert?.src_ip}`);
        return;
    }

    if (!alert?.src_ip || isPrivateIP(alert.src_ip)) {
        logger.info(`⛔ Ignoring private/internal IP: ${alert?.src_ip}`);
        return;
    }

    if (alert.level >= 5) {
        await storeAlert(alert);
        const count = await trackAlert(alert.src_ip);
        logger.info(
            count === 1
                ? "🔍 New alert detected!"
                : `🔄 Alert from ${alert.src_ip} triggered ${count} times.`
        );

        if (count === 1) {
            await handleAlertEscalation(client, groups, alert);
        } else if (count % 5 === 0) {
            await triggerActiveReponseNotification(
                client,
                groups,
                alert,
                count
            );
        }
        // Auto-report ke AbuseIPDB jika count cukup dan belum pernah dilaporkan
        else if (count >= 5) {
            const reportedKey = `reported_ip:${alert.src_ip}`;
            const alreadyReported = await redisClient.get(reportedKey);

            if (!alreadyReported) {
                const abuseInfo = await abuseIpDBCheck(alert.src_ip);
                const score = abuseInfo?.data?.abuseConfidenceScore || 0;

                if (score < 25) {
                    const hasQuota = await checkQuotaAbuseIPDB(
                        process.env.ABUSEIPDB_API_KEY
                    );

                    if (hasQuota) {
                        const reportResult = await reportToAbuseIPDB(
                            alert.src_ip,
                            alert,
                            process.env.ABUSEIPDB_API_KEY
                        );

                        if (reportResult?.data) {
                            await redisClient.setEx(reportedKey, 86400, "1"); // Tandai sudah dilaporkan 1x24 jam
                            await client.sendMessage(
                                groups.alertTrigger,
                                `✅ *Auto-report sent to AbuseIPDB!*\n🌐 IP: ${
                                    alert.src_ip
                                }\n🗂 Categories: ${reportResult.data.categories.join(
                                    ", "
                                )}`
                            );
                        } else {
                            await client.sendMessage(
                                groups.alertTrigger,
                                `❌ Gagal report ${alert.src_ip} ke AbuseIPDB.`
                            );
                        }
                    } else {
                        await client.sendMessage(
                            groups.alertTrigger,
                            `⚠️ Kuota AbuseIPDB habis. Tidak bisa report ${alert.src_ip}.`
                        );
                    }
                }
            }
        }
    } else if (alert.rule === "5402" && alert.level === 3) {
        await processRule5402Alert(client, groups, alert);
    } else {
        logger.info(
            `Ignoring alert (level ${alert.level}) from ${alert.src_ip}.`
        );
    }
}

// Wazuh webhook receiver
function setupActiveResponseRoutes(client, groups) {
    wazuhRouter.post("/alerts", apiKeyMiddleware, async (req, res) => {
        try {
            const alert = req.body;
            let reformatAlert = {
                id: alert.agent.id,
                agent: alert.agent.name,
                rule: alert.rule.id,
                account:
                    alert.data && alert.data.dstuser ? alert.data.dstuser : "",
                description: alert.rule.description,
                level: alert.rule.level,
                timestamp: alert.timestamp,
                src_ip: alert.data && alert.data.srcip ? alert.data.srcip : "-",
                groups: alert.rule.groups,
                full_log: alert.full_log,
            };

            if (
                (alert.rule.id === "5402" || alert.rule.level >= 3) &&
                !alert.rule.id.startsWith("2350")
            ) {
                processAlert(reformatAlert, client, groups);
                res.status(200).json({ status: "Alert received successfully" });
            } else {
                logger.warn("Alert content is undefined or null");
                res.status(400).json({ error: "Alert content is missing" });
            }
        } catch (error) {
            logger.error("Error processing alert:", error);
            res.status(500).json({ error: "Error processing alert" });
        }
    });

    wazuhRouter.get("/alerts/:ip", allowEitherSession, async (req, res) => {
        logger.info(`Getting alerts for IP: ${req.params.ip}`);
        const key = `alerts:${req.params.ip}`;
        const alerts = await redisClient.lRange(key, 0, -1);
        res.json(alerts.map(JSON.parse));
    });

    // Root endpoint for testing
    wazuhRouter.get("/", (req, res) => {
        res.send("Wazuh webhook receiver is running!");
    });

    return wazuhRouter;
}

// Get summary of active response alerts via Web
wazuhRouter.get("/alerts/summary", allowEitherSession, async (req, res) => {
    try {
        logger.info("Fetching all alerts...");
        const keys = (await redisClient.keys("alerts:*")) || [];

        // Run all Redis queries in parallel
        const alertLists = await Promise.all(
            keys.map((key) => redisClient.lRange(key, 0, -1))
        );

        // Flatten the results and parse JSON
        const alerts = alertLists.flat().map(JSON.parse);

        res.json(alerts);
    } catch (error) {
        if (!res.headersSent) {
            logger.error("Error fetching alerts:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

// Get summary of active response alerts via WhatsApp
async function handleActiveResponseSummary(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Summary of alerts...");
        const keys = (await redisClient.keys("alerts:*")) || [];
        if (keys.length > 0) {
            const alerts = [];
            for (const key of keys) {
                const alertList = await redisClient.lRange(key, 0, -1);
                alerts.push(...alertList.map(JSON.parse));
            }

            const ipCounts = alerts.reduce((acc, alert) => {
                if (!acc[alert.src_ip]) {
                    acc[alert.src_ip] = {
                        count: 0,
                        agent: alert.agent,
                        level: alert.level,
                    };
                }
                acc[alert.src_ip].count += 1;
                acc[alert.src_ip].level = Math.max(
                    acc[alert.src_ip].level,
                    alert.level
                ); // Keep the highest level
                return acc;
            }, {});

            const sortedEntries = Object.entries(ipCounts).sort(
                (a, b) => b[1].count - a[1].count || b[1].level - a[1].level
            );

            let summaryMessage = "Summary of alerts\n\n";
            summaryMessage += `⏱️ 1 hour ago\n\n`;
            summaryMessage += `Total alerts: *${alerts.length}*\n\n`;
            summaryMessage += `Total unique IPs: *${
                Object.keys(ipCounts).length
            }*\n\n`;
            summaryMessage += `Top 5 IPs with most alerts:\n\n`;
            for (const [ip, data] of sortedEntries.slice(0, 5)) {
                summaryMessage += `🖥️ *Agent*: ${data.agent}\n`;
                summaryMessage += `🔔 *Rule Level*: ${data.level}\n`;
                summaryMessage += `🔄 *Triggered*: ${data.count} times\n`;
                summaryMessage += `🌐 *IP Address*: ${ip}\n`;
                summaryMessage += `🔗 *Link Detail*: ${process.env.LOG_URL}/summary\n\n`;
            }

            await message.reply(summaryMessage);
            await message.reply(
                `See another summary at ${process.env.LOG_URL}/summary`
            );
        } else {
            await message.reply("No alerts available.");
        }
    } catch (error) {
        logger.error("Error getting active response:", error);
    }
}

// Login to Wazuh API to get JWT token
async function loginToWazuh() {
    try {
        const response = await axios.post(
            `${process.env.WAZUH_API_URL}/security/user/authenticate`,
            {},
            {
                headers: {
                    Authorization:
                        "Basic " +
                        Buffer.from(
                            `${process.env.WAZUH_API_USER}:${process.env.WAZUH_API_PASS}`
                        ).toString("base64"),
                    "Content-Type": "application/json",
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // Ignore self-signed SSL issues
                }),
            }
        );

        return response.data.data.token;
    } catch (error) {
        logger.error(
            "Error getting JWT token:",
            error.response?.data || error.message
        );
        return null;
    }
}

// Trigger active response to block IP
async function triggerActiveReponse(idAgent, ipAddress) {
    try {
        logger.info("Triggering active response...");

        const jwtToken = await loginToWazuh();
        const response = await axios.put(
            `${process.env.WAZUH_API_URL}/active-response?agents_list=${idAgent}&pretty=true`,
            {
                command: "!firewalld-drop",
                arguments: [`${ipAddress}`],
            },
            {
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                },
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false, // Accept self-signed certificates
                }),
            }
        );

        if (response.data.data.total_failed_items === 0) {
            return true;
        }

        return false;
    } catch (error) {
        logger.error("Error triggering active response:", error);
    }
}

module.exports = {
    setupActiveResponseRoutes,
    handleActiveResponseSummary,
    abuseIpDBCheck,
    threatFoxCheck,
    isInteresting,
    sendAlertMessage,
    processAlert,
    trackAlert,
};
