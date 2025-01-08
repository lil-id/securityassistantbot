// Required packages
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { exec } = require("child_process");
const systemMonitor = require('./src/models/systemMonitor');
const accountMonitor = require('./src/models/accountMonitor');
const feedBackModel = require('./src/models/feedBackModel');
const prisma = require('./src/helpers/databaseConnection');
require('dotenv').config();

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Role-based command handlers
const adminCommands = {
    '!server': systemMonitor.handleServerStatus,
    '!monitor': handleMonitorCommand,
    '!threshold': handleThresholdCommand,
    '!account': accountMonitor.handleAccountCheck,
    '!accmon': handleAccountMonitorCommand,
    '!container': handleContainerStatus,
    '!snap': handleSnapshot,
    '!response': handleActiveResponse,
    '!feedback': handleFeedback,
    // '!stop': handleStop,
    '!report': handleReport,
    '!help': handleHelp,
    '!info': handleInfo,
    // Add more user commands here
};

const userCommands = {
    '!server': systemMonitor.handleServerStatus,
    '!account': accountMonitor.handleAccountCheck,
    '!container': handleContainerStatus,
    '!snap': handleSnapshot,
    '!response': handleActiveResponse,
    '!feedback': handleFeedback,
    '!report': handleReport,
    '!help': handleHelp,
    '!info': handleInfo,
    // Add more user commands here
};

// Generate QR code for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp.');
});
// process.env.PORT
client.on('ready', () => {
    console.log('Client is ready!');
    systemMonitor.startMonitoring(client, process.env.ADMIN_NUMBER);
    accountMonitor.startAccountMonitoring(client, process.env.ADMIN_NUMBER);
});

// Message handler
client.on('message_create', async (message) => {
    const sender = message.from;
    const content = message.body;

    // Check if it's a command (starts with !)
    if (!content.startsWith('!')) return;

    // Split command and arguments
    const [command, ...args] = content.split(' ');

    const adminPhoneNumber = await prisma.admins.findUnique({
        where: {
          numberPhone: sender
        },
        select: {
            id: true,
        }
    });

    // Handle based on role
    if (adminPhoneNumber) {
        // Admin commands
        const adminHandler = adminCommands[command];
        await prisma.adminActicitylogs.create({
            data: {
                idAdmin: adminPhoneNumber.id,
                activity: command,
            }
        });

        if (adminHandler) {
            await adminHandler(message, args);
        } else {
            // Admin can also use user commands
            const userHandler = userCommands[command];
            if (userHandler) {
                await userHandler(message, args);
            }
        }
    } else {
        // User commands only
        const userHandler = userCommands[command];
        if (userHandler) {
            await userHandler(message, args);
        }
    }
});

// Admin command handlers
// Start/stop monitoring command handler
async function handleMonitorCommand(message, args) {
    if (!args.length) {
        await message.reply(
            'Usage:\n' +
            '!monitor start [interval] - Start monitoring (interval in minutes, default 5)\n' +
            '!monitor stop - Stop monitoring'
        );
        return;
    }

    const action = args[0].toLowerCase();
    if (action === 'start') {
        const interval = args[1] ? parseInt(args[1]) * 60 * 1000 : undefined;
        systemMonitor.startMonitoring(client, process.env.ADMIN_NUMBER, interval);
        await message.reply(`Monitoring started. Interval: ${interval ? interval/60000 : 5} minutes`);
    } else if (action === 'stop') {
        systemMonitor.stopMonitoring();
        await message.reply('Monitoring stopped');
    }
}

// Threshold configuration command handler
async function handleThresholdCommand(message, args) {
    if (args.length !== 3) {
        await message.reply(
            'Usage: !threshold <cpu|memory|storage> <warning|critical> <value>\n' +
            'Example: !threshold cpu warning 70'
        );
        return;
    }

    const [resource, level, value] = args;
    const numValue = parseInt(value);

    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
        await message.reply('Value must be between 0 and 100');
        return;
    }

    if (systemMonitor.THRESHOLDS[resource] && systemMonitor.THRESHOLDS[resource][level] !== undefined) {
        systemMonitor.THRESHOLDS[resource][level] = numValue;
        await message.reply(`${resource} ${level} threshold set to ${numValue}%`);
    } else {
        await message.reply('Invalid resource or level');
    }
}

// Account monitoring command handler
async function handleAccountMonitorCommand(message, args) {
    if (!args.length) {
        await message.reply(
            'Usage:\n' +
            '!accmon start [interval] - Start account monitoring (interval in minutes, default 15)\n' +
            '!accmon stop - Stop account monitoring'
        );
        return;
    }

    const action = args[0].toLowerCase();
    if (action === 'start') {
        const interval = args[1] ? parseInt(args[1]) * 60 * 1000 : undefined;
        accountMonitor.startAccountMonitoring(client, process.env.ADMIN_NUMBER, interval);
        await message.reply(`Account monitoring started. Interval: ${interval ? interval/60000 : 15} minutes`);
    } else if (action === 'stop') {
        accountMonitor.stopAccountMonitoring();
        await message.reply('Account monitoring stopped');
    }
}

// Check container status command handler
async function handleContainerStatus(message, args) {
    try {
        const containerRunningStatus = await getRunningDockerContainers();
        const containerExitedStatus = await getExitedDockerContainers();
        // console.log("containerRunningStatus:", JSON.stringify(containerRunningStatus, null, 2));
                
        if (containerRunningStatus.length === 0) {
            message.reply("No Docker containers found");
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
        console.error("Error getting container status:", error);
        message.reply(`Error: ${error.message}`);
    }
    // await message.reply('Containers:\nRunning: 25\nStopped: 2\nTotal: 27');
}

async function handleSnapshot(message, args) {
    await message.reply('Creating system snapshot...\nSnapshot ID: SNAP-001');
}

async function handleActiveResponse(message, args) {
    await message.reply('Active Response Summary:\nAlerts: 12\nResolved: 8\nPending: 4');
}

// Parse Docker PS Output Function
async function parseDockerPsOutput(stdout) {
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
async function getRunningDockerContainers() {
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
                console.log('Parsed container count:', jsonData);
                resolve(jsonData);
            } catch (error) {
                console.error('Error parsing docker output:', error);
                reject(error);
            }
        });
    });
}

async function getExitedDockerContainers() {
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

async function handleHelp(message, args) {
    // Available commands based on role
    const isAdmin = message.from === process.env.ADMIN_NUMBER;
    let helpMessage = 'Available commands.\n\n';
    
    if (isAdmin) {
        helpMessage += '*Admin Commands*:\n';
        helpMessage += '!server - Check server status\n';
        helpMessage += '!monitor - Start monitoring server\n';
        helpMessage += '!threshold - Configure threshold\n';
        helpMessage += '!account - Check server accounts\n';
        helpMessage += '!container - Check container status\n';
        helpMessage += '!snap - Create snapshot\n';
        helpMessage += '!response - View active response summary\n';
        helpMessage += '!feedback - View all feedback\n';
        helpMessage += '!report - View all issues\n';
        helpMessage += '!help - Show this help message\n';
        helpMessage += '!info - Get bot information\n\n';
    }
    
    helpMessage += '*User Commands*:\n';
    helpMessage += '!help - Show this help message\n';
    helpMessage += '!info - Get bot information';
    
    await message.reply(helpMessage);
}

async function handleFeedback(message, args) {
    const feedback = args.join(' ');
    if (!feedback) {
        await message.reply('Please provide feedback text.\nFormat: !feedback your message here');
        return;
    }

    await feedBackModel.createFeedback(message.from, feedback);
    await message.reply('Thank you for your feedback! It has been recorded.');
}

async function handleReport(message, args) {
    const report = args.join(' ');
    if (!report) {
        await message.reply('Please provide report details.\nFormat: !report issue description');
        return;
    }
    await message.reply('Report received. We will investigate the issue.');
}

async function handleInfo(message, args) {
    // Basic info command
    await message.reply('Bot Security (Boty) v1.0\nCreated by lil-id');
}

// Initialize the client
client.initialize();