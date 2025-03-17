const { exec } = require("child_process");
const logger = require("../helpers/logger");

class dockerMonitor {
    // Parse Docker PS Output Function
    static async parseDockerPsOutput(stdout) {
        logger.info('Parsing docker ps output');
        if (!stdout || stdout.trim() === '') {
            logger.info('No output from docker ps command');
            return [];
        }

        const lines = stdout.trim().split('\n');
        
        if (lines.length < 2) {
            logger.info('No containers found (only header line or less)');
            return [];
        }

        try {
            // First line contains headers
            const headerLine = lines[0];
            
            // Find the starting index of each header based on their position in the header line
            const headerPositions = [];
            const headers = [];
            let headerPattern = /\s{2,}/g;
            let lastIndex = 0;
            
            // Split headers and get their positions
            headerLine.split(headerPattern).forEach(header => {
                const position = headerLine.indexOf(header, lastIndex);
                if (position !== -1) {
                    headerPositions.push(position);
                    headers.push(header.trim());
                    lastIndex = position + header.length;
                }
            });
            
            // Process each line using the header positions
            const data = lines.slice(1).map(line => {
                let container = {};
                
                // Use header positions to slice the line correctly
                for (let i = 0; i < headers.length; i++) {
                    const start = headerPositions[i];
                    const end = headerPositions[i + 1] || line.length;
                    const value = line.substring(start, end).trim();
                    container[headers[i]] = value;
                }
                return container;
            });

            // Filter to only include desired headers if needed
            const desiredHeaders = ['NAMES', 'STATUS', 'CREATED'];
            const filteredData = data.map(container => {
                const filteredContainer = {};
                desiredHeaders.forEach(header => {
                    if (container.hasOwnProperty(header)) {
                        filteredContainer[header] = container[header];
                    }
                });
                return filteredContainer;
            });

            return filteredData;
        } catch (error) {
            logger.error('Error parsing docker ps output:', error);
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