const { dockerMonitor } = require("../../src/models/dockerMonitor");

async function handleContainerStatus(client, message, args) {
    const commandOption = args.join(" ");
    try {
        if (commandOption.toLowerCase() === "active") {
            const containerRunningStatus =
                await dockerMonitor.getRunningDockerContainers();
            if (containerRunningStatus.length === 0) {
                message.reply("No active Docker containers found");
            } else {
                const formattedRunningStatusOutput = containerRunningStatus
                    .map(
                        (container) =>
                            `🔖 *Name*: ${container.NAMES}\n🪅 *Status*: ${container.STATUS}\n⏰ *Created*: ${container.CREATED}`
                    )
                    .join("\n\n");
                message.reply(
                    `Active Containers\n\n` + formattedRunningStatusOutput
                );
            }
            return;
        } else if (commandOption.toLowerCase() === "exited") {
            const containerExitedStatus =
                await dockerMonitor.getExitedDockerContainers();
            if (containerExitedStatus.length === 0) {
                message.reply("No exited Docker containers found");
            } else {
                const formattedExitedStatusOutput = containerExitedStatus
                    .map(
                        (container) =>
                            `🔖 *Name*: ${container.NAMES}\n🪅 *Status*: ${container.STATUS}\n⏰ *Created*: ${container.CREATED}`
                    )
                    .join("\n\n");
                message.reply(
                    `Exited Containers\n\n` + formattedExitedStatusOutput
                );
            }
            return;
        } else {
            message.reply(
                "Please provide argument text.\n\n*!container active* - Get active containers \n*!container exited* - Get exited containers"
            );
            return;
        }
    } catch (error) {
        console.error("Error getting container status:", error);
        message.reply(`Error: ${error.message}`);
    }
}

module.exports = { handleContainerStatus };