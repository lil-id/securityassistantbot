const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Base } = require('whatsapp-web.js');
const { default: ollama } = require('ollama');
const { exec } = require("child_process");

async function sendCommandToAI(text) {
    const response = await ollama.chat({
      model: 'llama3.2:1b',
      messages: [{ role: 'user', content: text }],
    })
    return response.message.content;
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', async (message) => {
    const menu = `
    *Choose what you want to check?*
    
    1. Running Docker Container
    2. Exited Docker Container

    Type: 1 or 2?
    `
    const number = "+6282293675164";
    const chatId = number.substring(1) + "@c.us";
    client.sendMessage(chatId, menu);
    console.log('Client is ready!');
});

async function sendMessageToContact(number, message) {
    const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
}

// Parse Docker PS Output Function
function parseDockerPsOutput(stdout) {
    console.log('Raw stdout:', stdout);
    
    if (!stdout || stdout.trim() === '') {
        console.log('No output from docker ps command');
        return [];
    }

    const lines = stdout.trim().split('\n');
    
    if (lines.length < 2) {
        console.log('No containers found (only header line or less)');
        return [];
    }

    try {
        // First line contains headers
        const headerLine = lines[0];
        
        // Find the starting index of each header based on their position in the header line
        const headerPositions = [];
        const headers = [];
        let headerPattern = /\s{2,}/g;
        let match;
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
        
        console.log('Headers:', headers);
        console.log('Header positions:', headerPositions);

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

            console.log('Processed container:', container);
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
        console.error('Error parsing docker ps output:', error);
        throw error;
    }
}

// Get Docker Containers Function
function getRunningDockerContainers() {
    return new Promise((resolve, reject) => {
        exec('docker ps --filter "status=running"', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing docker ps: ${error.message}`);
                return reject(error);
            }
            
            if (stderr) {
                console.error(`Docker command stderr: ${stderr}`);
                return reject(new Error(stderr));
            }

            try {
                const jsonData = parseDockerPsOutput(stdout);
                console.log('Parsed container count:', jsonData.length);
                resolve(jsonData);
            } catch (error) {
                console.error('Error parsing docker output:', error);
                reject(error);
            }
        });
    });
}

function getExitedDockerContainers() {
    return new Promise((resolve, reject) => {
        exec('docker ps --filter "status=exited"', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing docker ps: ${error.message}`);
                return reject(error);
            }
            
            if (stderr) {
                console.error(`Docker command stderr: ${stderr}`);
                return reject(new Error(stderr));
            }

            try {
                const jsonData = parseDockerPsOutput(stdout);
                console.log('Parsed container count:', jsonData.length);
                resolve(jsonData);
            } catch (error) {
                console.error('Error parsing docker output:', error);
                reject(error);
            }
        });
    });
}

// Message Handler
client.on('message_create', async message => {
    switch (message.body) {
        case "1":
            try {
                const containerStatus = await getRunningDockerContainers();
                console.log("containerStatus:", JSON.stringify(containerStatus, null, 2));
                
                if (containerStatus.length === 0) {
                    message.reply("No Docker containers found");
                } else {
                    // Format the output to be more readable
                    message.reply("Running Docker Containers: \n");
                    const formattedOutput = containerStatus.map(container => 
                        `*Name*: ${container.NAMES}\n*Status*: ${container.STATUS}\n*Created*: ${container.CREATED}`
                    ).join('\n\n');
                    
                    message.reply(formattedOutput);
                }
            } catch (error) {
                console.error("Error getting container status:", error);
                message.reply(`Error: ${error.message}`);
            }
            break;
        case "2":
            try {
                const containerStatus = await getExitedDockerContainers();
                console.log("containerStatus:", JSON.stringify(containerStatus, null, 2));
                
                if (containerStatus.length === 0) {
                    message.reply("No Docker containers found");
                } else {
                    // Format the output to be more readable
                    message.reply("Exited Docker Containers: \n");
                    const formattedOutput = containerStatus.map(container => 
                        `*Name*: ${container.NAMES}\n*Status*: ${container.STATUS}\n*Created*: ${container.CREATED}`
                    ).join('\n\n');
                    
                    message.reply(formattedOutput);
                }
            } catch (error) {
                console.error("Error getting container status:", error);
                message.reply(`Error: ${error.message}`);
            }
            break;
        default:
            // Code to execute if no cases match
            break;
    }
});

client.initialize();
