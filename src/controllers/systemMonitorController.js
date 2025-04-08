const { getSystemStats, startMonitoring, stopMonitoring, THRESHOLDS } = require("../../src/models/systemMonitor");
const logger = require("../helpers/logger");

async function handleServerStatus(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        const result = await getSystemStats();
        if (!result || !result.stats) {
            throw new Error("Invalid system statistics data received");
        }

        const response = `System Statistics\n\n` +
                        `${result.stats.cpu}\n` +
                        `${result.stats.memory}\n` +
                        `${result.stats.storage}`;
        
        await message.reply(response);

        // Send alerts if there are warnings
        if (result.hasAlerts && result.alerts.length > 0) {
            const alertMessage = `System Alert\n\n${result.alerts.join('\n')}`;
            await message.reply(alertMessage);
        }
    } catch (error) {
        logger.error("Error getting system statistics:", error);
        await message.reply('Error getting system statistics');
    }
}

async function handleMonitorCommand(client, message, args) {
    if (!args.length) {
        await message.reply(
            "Usage:\n" +
                "`!monitor start <interval>` - Start monitoring (interval in minutes, default *5 minutes*)\n" +
                "`!monitor stop` - Stop monitoring"
        );
        return;
    }

    const parsedArgs = args.join(" ").split(" ");
    const action = parsedArgs[0].toLowerCase();

    if (action === "start") {
        const interval = parsedArgs[1] ? parseInt(parsedArgs[1]) * 60 * 1000 : undefined;
        startMonitoring(
            client,
            message.from,
            interval
        );
        await message.reply(
            `System monitoring started\n\n` +
            `⏱️ Interval: *${interval ? interval / 60000 : 5} minutes*\n\n` +
            `🔄 The bot will check every *${interval ? interval / 60000 : 5} minutes*.\n\n` +
            `⚠️ You will receive alerts if any thresholds are *exceeded*.`
        );
    } else if (action === "stop") {
        stopMonitoring();
        await message.reply("Monitoring stopped.");
    } else {
        await message.reply(
            "Usage:\n" +
                "`!monitor start <interval>` - Start monitoring (interval in minutes, default 5)\n" +
                "`!monitor stop` - Stop monitoring"
        );
    }    
}

async function handleThresholdCommand(client, message, args) {
    const parsedArgs = args.join(" ").split(" ");
    if (parsedArgs.length !== 3) {
        await message.reply(
            "Usage:\n`!threshold <cpu|memory|storage> <warning|critical> <value>`\n\n" +
            "Example:\n`!threshold cpu warning 70`"
        );
        return;
    }

    const [resource, level, value] = parsedArgs;
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        await message.reply("Value must be between 0 and 100");
        return;
    }

    if (
        THRESHOLDS[resource] &&
        THRESHOLDS[resource][level] !== undefined
    ) {
        THRESHOLDS[resource][level] = numValue;
        await message.reply(
            `${resource} ${level} threshold set to *${numValue}%*`
        );
    } else {
        await message.reply("Invalid resource or level.");
    }
}

module.exports = { handleMonitorCommand, handleThresholdCommand, handleServerStatus };