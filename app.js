const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const express = require("express");
const qrcode = require("qrcode-terminal");
const bodyParser = require("body-parser");
const routes = require("./src/routes/index");
const logger = require("./src/helpers/logger");
const { startBotnetCheck } = require("./src/controllers/handleBotnetCheck");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { botAdmins } = require("./src/models/admins/adminModel");
const { checkRoles } = require("./src/helpers/rolesChecker");
const {
    prisma,
    checkDatabaseConnection,
} = require("./src/helpers/databaseConnection");
const { adminCommands, userCommands } = require("./src/models/commandModel");
const { startAccountCheck } = require("./src/controllers/accountMonitorController");
const { startCronJob } = require("./src/helpers/cronHelper");

// Make sure .env values are loaded
require("dotenv").config();

// Check database connection
checkDatabaseConnection();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true, // Enable cookies if needed
    })
);
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);
app.use(bodyParser.json());
app.set("trust proxy", true);

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
    logger.info("QR Code generated. Please scan with your WhatsApp app.");
});

// Store group IDs
const groups = {
    announcement: "",
    member: "",
    alertTrigger: "",
};

// Check if client is ready
client.on("ready", async () => {
    logger.info("Client is ready!");
    // Find group IDs
    async function findGroups() {
        const chats = await client.getChats();
        chats.forEach((chat) => {
            if (chat.name.toLowerCase() === "security alert") {
                groups.announcement = chat.id._serialized;
            } else if (chat.name.toLowerCase() === "security member") {
                groups.member = chat.id._serialized;
            } else if (chat.name.toLowerCase() === "alert trigger") {
                groups.alertTrigger = chat.id._serialized;
            }
        });
    }

    findGroups();

    // Start botnet & account check every 5 minutes
    startAccountCheck(client, groups);
    startBotnetCheck(client, groups);

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
        logger.info("First admin added to the database.");
    } else {
        logger.info("Admin already exists in the database.");
    }

    // Load the cron schedule from the database
    const cronJobSchedule = await prisma.cronJobsSchedule.findUnique({
        where: { id: 1 },
    });

    // Default schedule is every day at 23:59
    let cronSchedule = "59 23 * * *";
    if (cronJobSchedule) {
        cronSchedule = `${cronJobSchedule.hourMinute} ${cronJobSchedule.dayOfMonth} ${cronJobSchedule.month} ${cronJobSchedule.dayOfWeek}`;
    }

    // Start the initial cron job
    startCronJob(cronSchedule, client, groups);
    logger.info(`Initial cron job started at ${cronSchedule} WITA (UTC+8).`);

    // Start the Express server after the WhatsApp client is ready
    server.listen(PORT, () => {
        logger.info(`Wazuh webhook receiver listening on port ${PORT}`);
    });

    // Message handler
    client.on("message_create", async (message) => {
        const content =
            typeof message.body === "string"
                ? message.body.replace(/\*/g, "")
                : "";
        // Split the message by new lines
        const lines = content.split("\n").map(line => line.trim()).filter(line => line);

        // Check if there's at least one line and it starts with "!"
        if (lines.length === 0 || !lines[0].startsWith("!")) return;

        // Extract command and arguments
        const commandParts = lines[0].split(" "); // First line
        const command = commandParts[0]; // Command itself (!feedback)
        const inlineArgs = commandParts.slice(1).join(" "); // Inline argument
        const multiLineArgs = lines.slice(1).join("\n"); // Multi-line argument

        // Final arguments handling
        const args = inlineArgs || multiLineArgs ? [inlineArgs || multiLineArgs] : [];
        const getRole = await checkRoles(message.author);

        // Handle based on role
        if (getRole && getRole.role === "admin") {
            const adminHandler = adminCommands[command];
            await prisma.adminActivitylogs.create({
                data: {
                    idAdmin: getRole.id,
                    name: getRole.name,
                    activity: content,
                },
            });

            if (adminHandler) {
                await adminHandler(client, message, args, groups);
            }
        } else if (getRole && getRole.role === "user") {
            const userHandler = userCommands[command];
            await prisma.userActivitylogs.create({
                data: {
                    idUser: getRole.id,
                    name: getRole.name,
                    activity: content,
                },
            });
            
            if (userHandler) {
                await userHandler(client, message, args, groups);
            }
        } else {
            logger.info("User not found in the database.");
            await client.sendMessage(
                message.from,
                "You are not registered. Please contact an admin to register."
            );
        }
    });
});

// Initialize the client
client.initialize();

routes(app, client, groups);

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
