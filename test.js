// Required packages
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const systemMonitor = require('./src/models/systemMonitor');
const accountMonitor = require('./src/models/accountMonitor');
const { dockerMonitor } = require('./src/models/dockerMonitor');
const { feedBack } = require('./src/models/feedBackModel');
const { reportBot } = require('./src/models/reportModel');
const { checkRoles } = require('./src/helpers/rolesCheck');
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
                activity: content,
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

async function handleSnapshot(message, args) {
    await message.reply('Creating system snapshot...\nSnapshot ID: SNAP-001');
}

async function handleActiveResponse(message, args) {
    await message.reply('Active Response Summary:\nAlerts: 12\nResolved: 8\nPending: 4');
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

async function handleContainerStatus(message, args) {
    const commandOption = args.join(' ');
    try {
        if (commandOption.toLowerCase() === 'active') {
            const containerRunningStatus = await dockerMonitor.getRunningDockerContainers();
            if (containerRunningStatus.length === 0) {
                message.reply("No active Docker containers found");
            } else {
                const formattedRunningStatusOutput = containerRunningStatus.map(container => 
                `🔖 *Name*: ${container.NAMES}\n🪅 *Status*: ${container.STATUS}\n⏰ *Created*: ${container.CREATED}`
                ).join('\n\n');                    
                message.reply(`⚡ *Active Containers* ⚡\n\n` + formattedRunningStatusOutput);
            }
            return;
        } else if (commandOption.toLowerCase() === 'exited') {
            const containerExitedStatus = await dockerMonitor.getExitedDockerContainers();
            if (containerExitedStatus.length === 0) {
                message.reply("No exited Docker containers found");
            } else {
                const formattedExitedStatusOutput = containerExitedStatus.map(container => 
                `🔖 *Name*: ${container.NAMES}\n🪅 *Status*: ${container.STATUS}\n⏰ *Created*: ${container.CREATED}`
                ).join('\n\n');
                message.reply(`🚨 *Exited Containers* 🚨\n\n` + formattedExitedStatusOutput);
            }
            return;
        } else {
            message.reply('Please provide argument text.\n\nFormat:\n\n*!container active* - Get active containers \n*!container exited* - Get exited containers');
            return;
        }
    } catch (error) {
        console.error("Error getting container status:", error);
        message.reply(`Error: ${error.message}`);
    }
}

async function handleFeedback(message, args) {
    const feedBackMessage = args.join(' ');
    const phoneNumber = `${feedBackMessage}@c.us`;
    const isAdmin = await checkRoles(message.from) === 'admin';

    if (isAdmin) {
        if (feedBackMessage.toLowerCase() === 'all') {
            const feedbacks = await feedBack.getFeedbacks();
            await message.reply(`All feedbacks:\n\n${feedbacks}`);
            return;
        } else if (/^62\d{10,13}@c\.us$/.test(phoneNumber)) {
            const feedback = await feedBack.getFeedbackById(phoneNumber);
            await message.reply(`Feedback from ${feedBackMessage}:\n\n${feedback}`);
            return;
        } else {
            await message.reply('Please provide argument text.\n\nFormat:\n\n*!feedback all* - Get all feedbacks \n*!feedback [userPhoneNumber]* - Get specific feedback');
            return;
        }
    }

    if (!feedBackMessage) {
        await message.reply('Please provide feedback text.\nFormat: !feedback your message here');
        return;
    }

    await feedBack.createFeedback(message.from, feedBackMessage);
    await message.reply('Thank you for your feedback! It has been recorded.');
}

async function handleReport(message, args) {
    const reportMessage = args.join(' ');
    const phoneNumber = `${reportMessage}@c.us`;
    const evidence = message._data.quotedMsg && message._data.quotedMsg.body ? message._data.quotedMsg.body : 'No evidence provided';

    if (reportMessage.toLowerCase() === 'all') {
        const reports = await reportBot.getReports();
        await message.reply(`All reports:\n\n${reports}`);
        return;
    } else if (/^62\d{10,13}@c\.us$/.test(phoneNumber)) {
        const report = await reportBot.getReportById(phoneNumber);
        await message.reply(`Report from ${reportMessage}:\n\n${report}`);
        return;
    }
    // TODO: This is a temporary fix to allow reporting without evidence
    else if (!reportMessage) {
        await reportBot.createReport(message.from, evidence, reportMessage);
        await message.reply('Report received. We will investigate the issue.');
        return;
    } else {
        await message.reply('Please provide report details.\nFormat: !report issue description');
        await message.reply('Please provide argument text.\n\nFormat:\n\n*!report all* - Get all feedbacks \n*!report [userPhoneNumber]* - Get specific feedback');
        return;
    }

    // if (!reportMessage) {
    //     await message.reply('Please provide feedback text.\nFormat: !feedback your message here');
    //     return;
    // }
}

async function handleInfo(message, args) {
    await message.reply('Bot Security (Boty) v1.0\nCreated by lil-id');
}

// Initialize the client
client.initialize();