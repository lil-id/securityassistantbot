const { Client, LocalAuth } = require("whatsapp-web.js");
const { botAdmins } = require("./src/models/admins/adminModel");
const { botUsers } = require("./src/models/users/userModel");
const { dockerMonitor } = require("./src/models/dockerMonitor");
const { feedBack } = require("./src/models/feedBackModel");
const { reportBot } = require("./src/models/reportModel");
const { checkRoles } = require("./src/helpers/rolesChecker");
const { handleReport } = require('./src/controllers/reportController');
const { handleBotTermination } = require('./src/controllers/botController');
const { prisma, checkDatabaseConnection } = require('./src/helpers/databaseConnection');
const { ollamaModel } = require("./src/models/ai/ollamaModel");
const { exec } = require('child_process');
const cron = require('node-cron');
const qrcode = require("qrcode-terminal");
const systemMonitor = require("./src/models/systemMonitor");
const accountMonitor = require("./src/models/accountMonitor");
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');

require("dotenv").config();

// Check database connection
checkDatabaseConnection();

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secure-secret-key';

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.set('trust proxy', true);

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
});

// Generate QR code for authentication
client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
    console.log("QR Code generated. Please scan with WhatsApp.");
});

// Check if client is ready
client.on("ready", async () => {
    console.log("Client is ready!");
    // Find group IDs
    async function findGroups() {
        const chats = await client.getChats();
        chats.forEach((chat) => {
            if (chat.name.toLowerCase() === "security alert") {
                groups.announcement = chat.id._serialized;
            } else if (chat.name.toLowerCase() === "security member") {
                groups.member = chat.id._serialized;
            }
        });
    }

    findGroups();

    const initializeAdmin = {
        name: "First Admin",
        id: {
            _serialized: client.info.wid._serialized,
        },
    };

    const existingAdmins = await botAdmins.checkExistingAdmins([
        initializeAdmin,
    ]);

    if (existingAdmins.length === 0) {
        await botAdmins.addAdmins([initializeAdmin]);
        console.log("First admin added to the database.");
    } else {
        console.log("Admin already exists in the database.");
    }
    // systemMonitor.startMonitoring(client, process.env.ADMIN_NUMBER);
    // accountMonitor.startAccountMonitoring(client, process.env.ADMIN_NUMBER);
});

// Message handler
client.on("message_create", async (message) => {
    const content = typeof message.body === 'string' ? message.body.replace(/\*/g, "") : '';

    // Check if it's a command (starts with !)
    if (!content.startsWith("!")) return;

    // Split command and arguments
    const [command, ...args] = content.split(" ");
    const getRole = await checkRoles(message.author);

    // Handle based on role
    if (getRole && getRole.role === "admin") {
        const adminHandler = adminCommands[command];
        await prisma.adminActicitylogs.create({
            data: {
                idAdmin: getRole.id,
                name: getRole.name,
                activity: content,
            },
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

// Webhook endpoint
app.post('/wazuh/alerts', async (req, res) => {
    try {
        const alert = req.body;

        if (alert.length !== 0) {
            // Send message to WhatsApp group
            await client.sendMessage(groups.announcement, 
                `🖥️ *Agent*: ${alert.agent.name}\n` +
                `📝 *Description*: ${alert.rule.description}\n` + 
                `🔔 *Rule Level*: ${alert.rule.level}\n` +
                `🕒 *Timestamp*: ${alert.timestamp}\n` +
                `🌐 *Src IP*: ${alert.data.srcip}\n` +
                `🏷️ *Groups*: ${alert.rule.groups}\n` +
                `📋 *Full Log*: ${alert.full_log}\n`
            );
            res.status(200).json({ status: 'Alert received successfully' });
        } else {
            console.warn('Alert content is undefined or null');
            res.status(400).json({ error: 'Alert content is missing' });
        }
    } catch (error) {
        console.error('Error processing alert:', error);
        res.status(500).json({ error: 'Error processing alert' });
    }
});

// Root endpoint for testing
app.get('/', (req, res) => {
    res.send('Wazuh webhook receiver is running!');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Store group IDs
const groups = {
    announcement: "",
    member: "",
};

// Add more commands here
const adminCommands = {
    "!admin": handleAddAdminCommand,
    "!ask": handleAddAICommand,
    "!user": handleAddUserCommand,
    "!server": systemMonitor.handleServerStatus,
    "!monitor": handleMonitorCommand,
    "!threshold": handleThresholdCommand,
    "!account": accountMonitor.handleAccountCheck,
    "!accmon": handleAccountMonitorCommand,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!response": handleActiveResponse,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
    "!stop": handleBotTermination,
};

const userCommands = {
    "!server": systemMonitor.handleServerStatus,
    "!account": accountMonitor.handleAccountCheck,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!response": handleActiveResponse,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
};

async function handleAddAICommand(message, args) {
    const content = args.join(" ");
    await message.reply("Asking AI...");
    const response = await ollamaModel.sendPrompt(content);
    await message.reply(response);
}

// Add users handler command
async function handleAddUserCommand(message, args) {
    const getMentionsNames = await message.getMentions();
    const existingUsers = await botUsers.checkExistingUsers(getMentionsNames);

    if (existingUsers.length > 0) {
        const existingUsersNames = getMentionsNames
            .filter((user) => existingUsers.includes(user.id._serialized))
            .map((user) => `🐨 ${user.name}`)
            .join("\n");
        await message.reply(
            `The following users already exist:\n\n${existingUsersNames}`
        );
    }

    const newUsers = getMentionsNames.filter(
        (user) => !existingUsers.includes(user.id._serialized)
    );
    if (newUsers.length > 0) {
        const addedUsers = await botUsers.addUsers(newUsers);
        const addedUsersNames = addedUsers
            .map((name) => `🐨 ${name}`)
            .join("\n");
        await message.reply(
            `Users have been added successfully:\n\n${addedUsersNames}`
        );
        await message.reply("Welcome to the team chief! 🎉");
    }
}

// Add users handler command
async function handleAddAdminCommand(message, args) {
    const getMentionsNames = await message.getMentions();
    const existingAdmins = await botAdmins.checkExistingAdmins(
        getMentionsNames
    );

    if (existingAdmins.length > 0) {
        const existingAdminsNames = getMentionsNames
            .filter((admin) => existingAdmins.includes(admin.id._serialized))
            .map((admin) => `🐨 ${admin.name}`)
            .join("\n");
        await message.reply(
            `The following admins already exist:\n\n${existingAdminsNames}`
        );
    }

    const newAdmins = getMentionsNames.filter(
        (admin) => !existingAdmins.includes(admin.id._serialized)
    );

    if (newAdmins.length > 0) {
        const addedAdmins = await botAdmins.addAdmins(newAdmins);
        const addedAdminsNames = addedAdmins
            .map((name) => `🐨 ${name}`)
            .join("\n");
        await message.reply(
            `Admins have been added successfully:\n\n${addedAdminsNames}`
        );
        await message.reply("Welcome to the team chief! 🎉");
    }
}

// Start/stop monitoring command handler
async function handleMonitorCommand(message, args) {
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
        systemMonitor.startMonitoring(
            client,
            process.env.ADMIN_NUMBER,
            interval
        );
        await message.reply(
            `Monitoring started. Interval: ${
                interval ? interval / 60000 : 5
            } minutes`
        );
    } else if (action === "stop") {
        systemMonitor.stopMonitoring();
        await message.reply("Monitoring stopped");
    }
}

// Threshold configuration command handler
async function handleThresholdCommand(message, args) {
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
        systemMonitor.THRESHOLDS[resource] &&
        systemMonitor.THRESHOLDS[resource][level] !== undefined
    ) {
        systemMonitor.THRESHOLDS[resource][level] = numValue;
        await message.reply(
            `${resource} ${level} threshold set to ${numValue}%`
        );
    } else {
        await message.reply("Invalid resource or level");
    }
}

// Account monitoring command handler
async function handleAccountMonitorCommand(message, args) {
    if (!args.length) {
        await message.reply(
            "Usage:\n" +
                "!accmon start [interval] - Start account monitoring (interval in minutes, default 15)\n" +
                "!accmon stop - Stop account monitoring"
        );
        return;
    }

    const action = args[0].toLowerCase();
    if (action === "start") {
        const interval = args[1] ? parseInt(args[1]) * 60 * 1000 : undefined;
        accountMonitor.startAccountMonitoring(
            client,
            process.env.ADMIN_NUMBER,
            interval
        );
        await message.reply(
            `Account monitoring started. Interval: ${
                interval ? interval / 60000 : 15
            } minutes`
        );
    } else if (action === "stop") {
        accountMonitor.stopAccountMonitoring();
        await message.reply("Account monitoring stopped");
    }
}

// System snapshot command handler
async function handleSnapshot(message, args) {
    await message.reply("Creating system snapshot...");
    exec('bash src/scripts/systemSnapshot.sh', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error creating snapshot: ${error.message}`);
            message.reply(`Error creating snapshot: ${error.message}`);
            return;
        }
        console.log(`Snapshot stdout: ${stdout}`);
        message.reply("Successfully created and uploaded snapshot to GCP Cloud Storage.");
    });
}

// Schedule snapshot to run every day at 00:00 AM
cron.schedule('25 11 * * *', () => {
    client.sendMessage(groups.member, "Running scheduled system snapshot...");
    console.log('Running scheduled system snapshot...');
    exec('bash src/scripts/systemSnapshot.sh', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error creating snapshot: ${error.message}`);
            return;
        }
        client.sendMessage(groups.member, "Scheduled system snapshot completed.");
    });
});

// Active response command handler
async function handleActiveResponse(message, args) {
    if (!alertContent) {
        await message.reply("No active response available");
        return;
    }

    await message.sendMessage(groups.announcement, alertContent);
}

// Container status command handler
async function handleContainerStatus(message, args) {
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

// Feedback command handler
async function handleFeedback(message, args) {
    const feedBackMessage = args.join(" ");
    const phoneNumber = message.mentionedIds;

    const getRole = await checkRoles(message.author);
    const getMentionsNames = await message.getMentions();

    const names = getMentionsNames
        .map((contact) => contact.name || "Unknown")
        .join(", ");

    if (getRole && getRole.role === "admin") {
        // Get all feedbacks
        if (feedBackMessage.toLowerCase() === "all") {
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
            await message.reply(
                "Please provide feedback details or provide argument text.\n\n*!report* issue description\n*!feedback all* - Get all feedbacks \n*!feedback <userPhoneNumber>* - Get specific feedback"
            );
            return;
        }
        // Create feedback
        else {
            await feedBack.createFeedback(message.author, feedBackMessage);
            await message.reply(
                "Thank you for your feedback! It has been recorded."
            );
        }
    }
}

// Report command handler
// async function handleReport(message, args) {
//     const reportMessage = args.join(" ");
//     const phoneNumber = message.mentionedIds;

//     const getRole = await checkRoles(message.author);
//     const getMentionsNames = await message.getMentions();

//     const names = getMentionsNames
//         .map((contact) => contact.name || "Unknown")
//         .join(", ");
//     const evidence =
//         message._data.quotedMsg && message._data.quotedMsg.body
//             ? message._data.quotedMsg.body
//             : "No evidence provided";

//     if (getRole && getRole.role === "admin") {
//         // Get all reports
//         if (reportMessage.toLowerCase() === "all") {
//             const reports = await reportBot.getReports();
//             await message.reply(`All reports:\n\n${reports}`);
//             return;
//         }
//         // Get report by phone number
//         else if (phoneNumber.length > 0) {
//             const report = await reportBot.getReportById(phoneNumber);
//             await message.reply(`Report from ${names}:\n\n${report}`);
//             return;
//         }
//         // No report message
//         else if (!reportMessage) {
//             await message.reply(
//                 "Please provide report details or provide argument text.\n\n*!report* issue description\n*!report all* - Get all reports \n*!report <userPhoneNumber>* - Get specific report"
//             );
//             return;
//         }
//         // Create report
//         else {
//             await reportBot.createReport(
//                 message.author,
//                 evidence,
//                 reportMessage
//             );
//             await message.reply(
//                 "Report received. We will investigate the issue."
//             );
//         }
//     }
// }

// Available commands based on role
async function handleHelp(message, args) {
    const getRole = await checkRoles(message.author);
    let helpMessage = "Available commands.\n\n";

    if (getRole && getRole.role === "admin") {
        helpMessage += "*Admin Commands*:\n";
        helpMessage += "!ask - Ask question to AI\n";
        helpMessage += "!admin - Added new admin\n";
        helpMessage += "!user - Added new member\n";
        helpMessage += "!server - Check server status\n";
        helpMessage += "!monitor - Start monitoring server\n";
        helpMessage += "!threshold - Configure threshold\n";
        helpMessage += "!account - Check server accounts\n";
        helpMessage += "!container - Check container status\n";
        helpMessage += "!snap - Create snapshot\n";
        helpMessage += "!response - View active response summary\n";
        helpMessage += "!feedback - View all feedback\n";
        helpMessage += "!report - View all issues\n";
        helpMessage += "!help - Show this help message\n";
        helpMessage += "!info - Get bot information\n";
        helpMessage += "!stop - Terminate bot\n";

        await message.reply(helpMessage);
        return;
    }

    helpMessage += "*User Commands*:\n";
    helpMessage += "!server - Check server status\n";
    helpMessage += "!account - Check server accounts\n";
    helpMessage += "!container - Check container status\n";
    helpMessage += "!snap - Create snapshot\n";
    helpMessage += "!response - View active response summary\n";
    helpMessage += "!feedback - Create feedback\n";
    helpMessage += "!report - Report issues\n";
    helpMessage += "!help - Show this help message\n";
    helpMessage += "!info - Get bot information\n";

    await message.reply(helpMessage);
    return;
}

// Bot information command handler
async function handleInfo(message, args) {
    await message.reply("Bot Security (Boty) v1.0\nCreated by lil-id");
}

// Bot information command handler
// async function handleBotTermination(message, args) {
//     await message.reply("Bot is terminating...");
//     await client.destroy();
// }

// Initialize the client
client.initialize();

// Start server
app.listen(PORT, () => {
    console.log(`Wazuh webhook receiver listening on port ${PORT}`);
});
