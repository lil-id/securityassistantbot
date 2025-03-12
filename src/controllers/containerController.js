const logger = require("../helpers/logger");
const { getRunningDockerContainers, getExitedDockerContainers } = require("../models/containerMonitor");

async function handleContainerStatus(client, message, args) {
    const commandOption = args.join(" ").toLowerCase();
    
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        let containers = [];
        let containerType = "";

        if (commandOption === "active") {
            containers = await getRunningDockerContainers();
            containerType = "Active";
        } else if (commandOption === "exited") {
            containers = await getExitedDockerContainers();
            containerType = "Exited";
        } else {
            message.reply(
                "Please provide a valid argument:\n\n" +
                "`!container active` - Get active containers\n" +
                "`!container exited` - Get exited containers"
            );
            return;
        }

        if (containers.length === 0) {
            logger.info(`No ${containerType} Docker containers found`);
            message.reply(`No ${containerType} Docker containers found`);
        } else {
            const formattedStatusOutput = containers
                .map(container => 
                    `🔖 *Name*: ${container.Names[0]}\n🪅 *Status*: ${container.Status}\n⏰ *Created*: ${new Date(container.Created * 1000).toLocaleString()}`
                )
                .join("\n\n");

            message.reply(`${containerType} Containers\n\n${formattedStatusOutput}`);
        }
    } catch (error) {
        logger.error("Error getting container status:", error);
        message.reply(`Error: ${error.message}`);
    }
}

module.exports = { handleContainerStatus };
