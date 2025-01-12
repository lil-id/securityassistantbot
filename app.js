const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const systemMonitor = require('./src/models/systemMonitor');
const accountMonitor = require('./src/models/accountMonitor');
const { botAdmins } = require('./src/models/admins/adminModel');
const { botUsers } = require('./src/models/users/userModel');
const { dockerMonitor } = require('./src/models/dockerMonitor');
const { feedBack } = require('./src/models/feedBackModel');
const { reportBot } = require('./src/models/reportModel');
const { checkRoles } = require('./src/helpers/rolesChecker');
const prisma = require('./src/helpers/databaseConnection');
const { get } = require('systeminformation');
require('dotenv').config();

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Add more commands here
const adminCommands = {
    // TODO: Add command to add user to admin or user general
    '!admin': handleAddAdminCommand,
    '!user': handleAddUserCommand,
    '!server': systemMonitor.handleServerStatus,
    '!monitor': handleMonitorCommand,
    '!threshold': handleThresholdCommand,
    '!account': accountMonitor.handleAccountCheck,
    '!accmon': handleAccountMonitorCommand,
    '!container': handleContainerStatus,
    '!snap': handleSnapshot,
    '!response': handleActiveResponse,
    '!feedback': handleFeedback,
    '!report': handleReport,
    '!help': handleHelp,
    '!info': handleInfo,
    '!stop': handleBotTermination,
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
};

// Generate QR code for authentication
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Please scan with WhatsApp.');
});

// Check if client is ready
client.on('ready', async () => {
    console.log('Client is ready!');
    const initializeAdmin = {
        name: 'First Admin',
        id: {
            _serialized: client.info.wid._serialized
        }
    };

    const existingAdmins = await botAdmins.checkExistingAdmins([initializeAdmin]);
    
    if (existingAdmins.length === 0) {
        await botAdmins.addAdmins([initializeAdmin]);
        console.log('First admin added to the database.');
    } else {
        console.log('Admin already exists in the database.');
    }
    // systemMonitor.startMonitoring(client, process.env.ADMIN_NUMBER);
    // accountMonitor.startAccountMonitoring(client, process.env.ADMIN_NUMBER);
});

// Message handler
client.on('message_create', async (message) => {
    const content = message.body.replace(/\*/g, '');

    // Check if it's a command (starts with !)
    if (!content.startsWith('!')) return;

    // Split command and arguments
    const [command, ...args] = content.split(' ');
    const getRole = await checkRoles(message.author);

    // Handle based on role
    if (getRole && getRole.role === 'admin') {
        const adminHandler = adminCommands[command];
        await prisma.adminActicitylogs.create({
            data: {
                idAdmin: getRole.id,
                name: getRole.name,
                activity: content,
            }
        });

        if (adminHandler) {
            await adminHandler(message, args);
        }
    } else {
        const userHandler = userCommands[command];
        if (userHandler) {
            await userHandler(message, args);
        }
    }
});

// Add users handler command
async function handleAddUserCommand(message, args) {
    const getMentionsNames = await message.getMentions();
    const existingUsers = await botUsers.checkExistingUsers(getMentionsNames);

    if (existingUsers.length > 0) {
        const existingUsersNames = getMentionsNames
            .filter(user => existingUsers.includes(user.id._serialized))
            .map(user => `🐨 ${user.name}`)
            .join('\n');
        await message.reply(`The following users already exist:\n\n${existingUsersNames}`);
    }

    const newUsers = getMentionsNames.filter(user => !existingUsers.includes(user.id._serialized));
    if (newUsers.length > 0) {
        const addedUsers = await botUsers.addUsers(newUsers);
        const addedUsersNames = addedUsers.map(name => `🐨 ${name}`).join('\n');
        await message.reply(`Users have been added successfully:\n\n${addedUsersNames}`);
        await message.reply('Welcome to the team chief! 🎉');
    }
}

// Add users handler command
async function handleAddAdminCommand(message, args) {
    const getMentionsNames = await message.getMentions();
    const existingAdmins = await botAdmins.checkExistingAdmins(getMentionsNames);

    if (existingAdmins.length > 0) {
        const existingAdminsNames = getMentionsNames
            .filter(admin => existingAdmins.includes(admin.id._serialized))
            .map(admin => `🐨 ${admin.name}`)
            .join('\n');
        await message.reply(`The following admins already exist:\n\n${existingAdminsNames}`);
    }

    const newAdmins = getMentionsNames.filter(admin => !existingAdmins.includes(admin.id._serialized));

    if (newAdmins.length > 0) {
        const addedAdmins = await botAdmins.addAdmins(newAdmins);
        const addedAdminsNames = addedAdmins.map(name => `🐨 ${name}`).join('\n');
        await message.reply(`Admins have been added successfully:\n\n${addedAdminsNames}`);
        await message.reply('Welcome to the team chief! 🎉');
    }
}

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

// System snapshot command handler
async function handleSnapshot(message, args) {
    await message.reply('Creating system snapshot...\nSnapshot ID: SNAP-001');
}

// Active response command handler
async function handleActiveResponse(message, args) {
    await message.reply('Active Response Summary:\nAlerts: 12\nResolved: 8\nPending: 4');
}

// Container status command handler
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
                message.reply(`Active Containers\n\n` + formattedRunningStatusOutput);
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
                message.reply(`Exited Containers\n\n` + formattedExitedStatusOutput);
            }
            return;
        } else {
            message.reply('Please provide argument text.\n\n*!container active* - Get active containers \n*!container exited* - Get exited containers');
            return;
        }
    } catch (error) {
        console.error("Error getting container status:", error);
        message.reply(`Error: ${error.message}`);
    }
}

// Feedback command handler
async function handleFeedback(message, args) {
    const feedBackMessage = args.join(' ');
    const phoneNumber = message.mentionedIds;
    
    const getRole = await checkRoles(message.author);
    const getMentionsNames = await message.getMentions();

    const names = getMentionsNames.map(contact => contact.name || 'Unknown').join(', ');
    
    if (getRole && getRole.role === 'admin') {
        // Get all feedbacks
        if (feedBackMessage.toLowerCase() === 'all') {
            const feedbacks = await feedBack.getFeedbacks();
            await message.reply(`All feedbacks:\n\n${feedbacks}`);
            return;
        }
        // Get feedback by phone number
        else if (phoneNumber.length > 0) {
            const feedback = await feedBack.getFeedbackById(phoneNumber);
            await message.reply(`Feedback from ${names}:\n\n${feedback}`);
            return;
        }
        // No feedback message
        else if (!feedBackMessage) {
            await message.reply('Please provide feedback details or provide argument text.\n\n*!report* issue description\n*!feedback all* - Get all feedbacks \n*!feedback <userPhoneNumber>* - Get specific feedback');
            return;
        }
        // Create feedback
        else {
            await feedBack.createFeedback(message.author, feedBackMessage);
            await message.reply('Thank you for your feedback! It has been recorded.');
        }
    }
}

// Report command handler
async function handleReport(message, args) {
    const reportMessage = args.join(' ');
    const phoneNumber = message.mentionedIds;

    const getRole = await checkRoles(message.author);
    const getMentionsNames = await message.getMentions();

    const names = getMentionsNames.map(contact => contact.name || 'Unknown').join(', ');
    const evidence = message._data.quotedMsg && message._data.quotedMsg.body ? message._data.quotedMsg.body : 'No evidence provided';

    if (getRole && getRole.role === 'admin') {     
        // Get all reports   
        if (reportMessage.toLowerCase() === 'all') {
            const reports = await reportBot.getReports();
            await message.reply(`All reports:\n\n${reports}`);
            return;
        }
        // Get report by phone number
        else if (phoneNumber.length > 0) {
            const report = await reportBot.getReportById(phoneNumber);
            await message.reply(`Report from ${names}:\n\n${report}`);
            return;
        }
        // No report message
        else if (!reportMessage) {
            await message.reply('Please provide report details or provide argument text.\n\n*!report* issue description\n*!report all* - Get all reports \n*!report <userPhoneNumber>* - Get specific report');
            return;
        }
        // Create report
        else {
            await reportBot.createReport(message.author, evidence, reportMessage);
            await message.reply('Report received. We will investigate the issue.');
        }
    }
}

// Available commands based on role
async function handleHelp(message, args) {
    const getRole = await checkRoles(message.author);
    let helpMessage = 'Available commands.\n\n';
    
    if (getRole && getRole.role === 'admin') {
        helpMessage += '*Admin Commands*:\n';
        helpMessage += '!admin - Added new admin\n'
        helpMessage += '!user - Added new member\n'
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
        helpMessage += '!info - Get bot information\n';
        helpMessage += '!stop - Terminate bot\n';

        await message.reply(helpMessage);
        return
    }
    
    helpMessage += '*User Commands*:\n';
    helpMessage += '!server - Check server status\n';
    helpMessage += '!account - Check server accounts\n';
    helpMessage += '!container - Check container status\n';
    helpMessage += '!snap - Create snapshot\n';
    helpMessage += '!response - View active response summary\n';
    helpMessage += '!feedback - Create feedback\n';
    helpMessage += '!report - Report issues\n';
    helpMessage += '!help - Show this help message\n';
    helpMessage += '!info - Get bot information\n';

    await message.reply(helpMessage);
    return;
}

// Bot information command handler
async function handleInfo(message, args) {
    await message.reply('Bot Security (Boty) v1.0\nCreated by lil-id');
}

// TODO: add termination command feature
// Bot information command handler
async function handleBotTermination(message, args) {
    const getRole = await checkRoles(message.author);
    console.log(getRole);
}

// Initialize the client
client.initialize();