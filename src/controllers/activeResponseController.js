const { Router } = require("express");
const redis = require("ioredis");
const axios = require("axios");
const logger = require("../helpers/logger");
const userSession = require("../middleware/usersMiddleware");
const adminSession = require("../middleware/adminsMiddleware");
const { apiKeyMiddleware } = require("../middleware/wazuhMiddleware");
require("dotenv").config();

const wazuhRouter = Router();
const redisClient = new redis();

// Check if IP is malicious using an external threat intelligence API
async function checkThreatIntel(ip, retries = 3) {
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
        return response.data.data.abuseConfidenceScore >= 50; // Mark if abuse score is high
    } catch (error) {
        if (error.code === "ETIMEDOUT" && retries > 0) {
            logger.warn(
                `Timeout occurred. Retrying... (${retries} retries left)`
            );
            return checkThreatIntel(ip, retries - 1);
        }
        logger.error("Threat intelligence check failed", error);
        return false;
    }
}

// Track alerts from the same IP
async function trackAlert(ip) {
    const key = `alert_count:${ip}`;
    let count = await redisClient.get(key);

    if (!count) {
        await redisClient.setex(key, 600, 1); // Set TTL of 10 minutes
        return 1; // First occurrence
    }

    count = parseInt(count) + 1;
    await redisClient.setex(key, 600, count); // Reset TTL on update
    return count;
}

// Store alerts in Redis (TTL: 10 minutes)
async function storeAlert(alert) {
    logger.info("Storing alert in Redis");
    const key = `alerts:${alert.src_ip}`;
    await redisClient.rpush(key, JSON.stringify(alert)); // Push alert to list
    await redisClient.expire(key, 600); // Set expiration to 10 minutes
}

// Determine if an alert is interesting
async function isInteresting(alert) {
    // Always check if the source IP is malicious
    const isMalicious = await checkThreatIntel(alert.src_ip);

    // Check alert severity
    if (isMalicious && alert.level >= 5) return true; // Critical alerts are always interesting

    return (
        alert.groups.includes("authentication_failed") &&
        alert.groups.includes("invalid_login")
    );
}

// Process incoming alert
async function processAlert(alert, client, groups) {
    await storeAlert(alert);
    const count = await trackAlert(alert.src_ip);
    logger.info(
        count === 1
            ? "🔍 New alert detected!"
            : "🔍 Alert already detected. Incrementing count..."
    );
    if (count === 1) {
        if (await isInteresting(alert)) {
            logger.info("🚨 Interesting alert detected! Escalating...");
            // Send message to WhatsApp group
            await client.sendMessage(
                groups.announcement,
                `🖥️ *Agent*: ${alert.agent}\n` +
                    `📝 *Description*: ${alert.description}\n` +
                    `🔔 *Rule Level*: ${alert.level}\n` +
                    `🕒 *Timestamp*: ${alert.timestamp}\n` +
                    `🌐 *Src IP*: ${alert.src_ip}\n` +
                    `🏷️ *Groups*: ${alert.groups}\n` +
                    `📋 *Full Log*: ${alert.full_log}\n` +
                    `🔗 *Link Detail*: ${process.env.LOG_URL}`
            );
        } else {
            logger.info("⚠️ False positive detected. Ignoring...");
        }
    } else if (count % 5 === 0) {
        logger.info(
            `🔄 Alert from ${alert.src_ip} triggered ${count} times. Notifying...`
        );
        await client.sendMessage(
            groups.alertTrigger,
            `🔄 Alert from *${alert.src_ip}* triggered ${count} times.`
        );
    } else {
        logger.info(`🔄 Alert from ${alert.src_ip} triggered ${count} times.`);
    }
}

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
}

function setupActiveResponseRoutes(client, groups, io) {
    wazuhRouter.post("/alerts", apiKeyMiddleware, async (req, res) => {
        try {
            const alert = req.body;
            let reformatAlert = {
                agent: alert.agent.name,
                description: alert.rule.description,
                level: alert.rule.level,
                timestamp: alert.timestamp,
                src_ip: alert.data.srcip ? alert.data.srcip : "None",
                groups: alert.rule.groups,
                full_log: alert.full_log,
            };

            // Emit alert to WebSocket clients
            io.emit("alert", alert);

            if (alert.length !== 0) {
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

    wazuhRouter.get(
        "/alerts/:ip",
        allowEitherSession,
        async (req, res) => {
            logger.info(`Getting alerts for IP: ${req.params.ip}`);
            const key = `alerts:${req.params.ip}`;
            const alerts = await redisClient.lrange(key, 0, -1);
            res.json(alerts.map(JSON.parse));
        }
    );

    // Root endpoint for testing
    wazuhRouter.get("/", (req, res) => {
        res.send("Wazuh webhook receiver is running!");
    });

    return wazuhRouter;
}

wazuhRouter.get("/alerts/summary", allowEitherSession, async (req, res) => {
    try {
        logger.info("Fetching all alerts...");
        const keys = await redisClient.keys("alerts:*");

        // Run all Redis queries in parallel
        const alertLists = await Promise.all(
            keys.map((key) => redisClient.lrange(key, 0, -1))
        );

        // Flatten the results and parse JSON
        const alerts = alertLists.flat().map(JSON.parse);

        res.json(alerts);
    } catch (error) {
        if (!res.headersSent) {
            console.error("Error fetching alerts:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
});

async function handleActiveResponse(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        logger.info("Summary of alerts...");
        const keys = await redisClient.keys("alerts:*");
        if (keys.length > 0) {
            const alerts = [];
            for (const key of keys) {
                const alertList = await redisClient.lrange(key, 0, -1);
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
            for (const [ip, data] of sortedEntries) {
                summaryMessage += `🖥️ *Agent*: ${data.agent}\n`;
                summaryMessage += `🔔 *Rule Level*: ${data.level}\n`;
                summaryMessage += `🔄 *Triggered*: ${data.count} times\n`;
                summaryMessage += `🌐 *IP Address*: ${ip}\n`;
                summaryMessage += `🔗 *Link Detail*: ${process.env.LOG_URL}/summary\n\n`;
            }

            await message.reply(summaryMessage);
        } else {
            await message.reply("No alerts available");
        }
    } catch (error) {
        logger.error("Error getting active response:", error);
    }
}

module.exports = { handleActiveResponse, setupActiveResponseRoutes };
