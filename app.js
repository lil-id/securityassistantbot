const http = require("http");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const express = require("express");
const cron = require("node-cron");
const qrcode = require("qrcode-terminal");
const bodyParser = require("body-parser");
const routes = require("./src/routes/index");
const logger = require("./src/helpers/logger");
const { exec } = require("child_process");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { botAdmins } = require("./src/models/admins/adminModel");
const { checkRoles } = require("./src/helpers/rolesChecker");
const {
    prisma,
    checkDatabaseConnection,
} = require("./src/helpers/databaseConnection");
const { adminCommands, userCommands } = require("./src/models/commandModel");
const { Server } = require("socket.io");
const { startCronJob } = require("./src/controllers/snapshotController");

// Make sure .env values are loaded
require("dotenv").config();

// Check database connection
checkDatabaseConnection();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

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
    logger.info("QR Code generated. Please scan with WhatsApp.");
});

// Store group IDs
const groups = {
    announcement: "",
    member: "",
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
    let cronJob = startCronJob(cronSchedule, client, groups);
    logger.info("Initial cron job started.");

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
                await adminHandler(client, message, args, groups, cronJob, cronJobSchedule);
            }
        } else {
            const userHandler = userCommands[command];
            if (userHandler) {
                await userHandler(client, message, args, groups, cronJob, cronJobSchedule);
            }
        }
    });
});

// Schedule snapshot to run every day at 00:00 AM
cron.schedule("59 23 * * *", () => {
    logger.info("Running scheduled system snapshot...");
    client.sendMessage(groups.member, "Running scheduled system snapshot...");
    exec(
        "bash src/scripts/systemSnapshot.sh",
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error creating snapshot: ${error.message}`);
                return;
            }
            logger.info(`Snapshot stdout: ${stdout}`);
            logger.error(`Snapshot stderr: ${stderr}`);
            logger.info(
                "Successfully created and uploaded snapshot to Cloud Storage."
            );
            client.sendMessage(
                groups.member,
                "Successfully created and uploaded snapshot to Cloud Storage."
            );
            client.sendMessage(
                groups.member,
                "Scheduled system snapshot completed."
            );
        }
    );
});

// Initialize the client
client.initialize();

routes(app, client, groups, io);

// WebSocket connection
io.on("connection", (socket) => {
    logger.info("user connected");
    socket.on("disconnect", () => {
        logger.info("user disconnected");
    });
});

// Error handling
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});
