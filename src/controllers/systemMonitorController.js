const { getSystemStats, startMonitoring, stopMonitoring, THRESHOLDS } = require("../../src/models/systemMonitor");

// Example usage with the WhatsApp bot
async function handleServerStatus(client, message, args) {
    try {
        const result = await getSystemStats();
        const response = `System Statistics\n\n` +
                        `${result.stats.cpu}\n` +
                        `${result.stats.memory}\n` +
                        `${result.stats.storage}`;
        
        await message.reply(response);

        // Send alerts to admin if there are any warnings/critical issues
        if (result.hasAlerts && message.from !== process.env.ADMIN_NUMBER) {
            const alertMessage = `System Alert\n\n${result.alerts.join('\n')}`;
            await client.sendMessage(process.env.ADMIN_NUMBER, alertMessage);
        }
    } catch (error) {
        await message.reply('Error getting system statistics');
    }
}

async function handleMonitorCommand(client, message, args) {
    if (!args.length) {
        await message.reply(
            "Usage:\n" +
                "!monitor start [interval] - Start monitoring (interval in minutes, default 5)\n" +
                "!monitor stop - Stop monitoring"
        );
        return;
    }

    const action = args[0].toLowerCase();
    if (action === "start") {
        const interval = args[1] ? parseInt(args[1]) * 60 * 1000 : undefined;
        startMonitoring(
            client,
            message.from,
            interval
        );
        await message.reply(
            `Monitoring started. Interval: ${
                interval ? interval / 60000 : 5
            } minutes`
        );
    } else if (action === "stop") {
        stopMonitoring();
        await message.reply("Monitoring stopped");
    }
}

// TODO: Need to clarify what this command for
async function handleThresholdCommand(client, message, args) {
    if (args.length !== 3) {
        await message.reply(
            "Usage: !threshold <cpu|memory|storage> <warning|critical> <value>\n" +
                "Example: !threshold cpu warning 70"
        );
        return;
    }

    const [resource, level, value] = args;
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
            `${resource} ${level} threshold set to ${numValue}%`
        );
    } else {
        await message.reply("Invalid resource or level");
    }
}

module.exports = { handleMonitorCommand, handleThresholdCommand, handleServerStatus };