const { exec } = require("child_process");
const logger = require("../helpers/logger");

class dockerMonitor {
    static async parseDockerPsOutput(stdout) {
        logger.info("Parsing docker ps output");
    
        if (!stdout || stdout.trim() === "") {
            logger.info("No output from docker ps command");
            return [];
        }
    
        const lines = stdout.trim().split("\n");

        if (lines.length < 2) {
            const headers = lines[0].split(/\s{2,}/);
            if (headers.length < 2) {
                logger.error("Malformed docker ps output (invalid headers)");
                throw new Error("Malformed docker ps output");
            }

            return [];
        }

        const headers = lines[0].split(/\s{2,}/);
    
        try {
            const containers = lines.slice(1).map((line) => {
                const values = line.split(/\s{2,}/);
    
                if (values.length !== headers.length) {
                    throw new Error("Malformed docker ps output");
                }
    
                return headers.reduce((acc, header, index) => {
                    acc[header.trim()] = values[index]?.trim() || "";
                    return acc;
                }, {});
            });
    
            // Extract only required fields
            return containers.map(({ NAMES, STATUS, CREATED }) => ({
                NAMES,
                STATUS,
                CREATED,
            }));
        } catch (error) {
            logger.error("Error parsing docker ps output:", error);
            throw error;
        }
    }    

    // Get Docker Containers Function
    static async getRunningDockerContainers() {
        logger.info('Getting running Docker containers');
        return new Promise((resolve, reject) => {
            exec('docker ps --filter "status=running"', (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error executing docker ps: ${error.message}`);
                    return reject(error);
                }
                
                if (stderr) {
                    logger.error(`Docker command stderr: ${stderr}`);
                    return reject(new Error(stderr));
                }

                try {
                    const jsonData = this.parseDockerPsOutput(stdout);
                    resolve(jsonData);
                } catch (error) {
                    logger.error('Error parsing docker output:', error);
                    reject(error);
                }
            });
        });
    }

    static async getExitedDockerContainers() {
        logger.info('Getting exited Docker containers');
        return new Promise((resolve, reject) => {
            exec('docker ps --filter "status=exited"', (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error executing docker ps: ${error.message}`);
                    return reject(error);
                }
                
                if (stderr) {
                    logger.error(`Docker command stderr: ${stderr}`);
                    return reject(new Error(stderr));
                }

                try {
                    const jsonData = this.parseDockerPsOutput(stdout);
                    resolve(jsonData);
                } catch (error) {
                    logger.error('Error parsing docker output:', error);
                    reject(error);
                }
            });
        });
    }

    // Check container status command handler
    static async handleContainerStatus(client, message, args) {
        try {
            const containerRunningStatus = await this.getRunningDockerContainers();
            const containerExitedStatus = await this.getExitedDockerContainers();
                    
            if (containerRunningStatus.length === 0) {
                logger.info("No running Docker containers found");
                message.reply("No running Docker containers found");
            } else {
                // Format the output to be more readable
                const formattedRunningStatusOutput = containerRunningStatus.map(container => 
                `*Name*: ${container.NAMES}\n*Status*: ${container.STATUS}\n*Created*: ${container.CREATED}`
                ).join('\n\n');
                message.reply(`⚡ *Active Containers* ⚡\n\n` + formattedRunningStatusOutput);

                const formattedExitedStatusOutput = containerExitedStatus.map(container => 
                `*Name*: ${container.NAMES}\n*Status*: ${container.STATUS}\n*Created*: ${container.CREATED}`
                ).join('\n\n');
                message.reply(`🚨 *Exited Containers* 🚨\n\n` + formattedExitedStatusOutput); 
            }
        } catch (error) {
            logger.error("Error getting container status:", error);
            message.reply(`Error: ${error.message}`);
        }
        // await message.reply('Containers:\nRunning: 25\nStopped: 2\nTotal: 27');
    }

}

module.exports = { dockerMonitor };