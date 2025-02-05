const { Client, LocalAuth } = require("whatsapp-web.js");
const { botAdmins } = require("./src/models/admins/adminModel");
const { checkRoles } = require("./src/helpers/rolesChecker");
const { prisma, checkDatabaseConnection } = require('./src/helpers/databaseConnection');
const { adminCommands, userCommands } = require('./src/models/commandModel');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const helmet = require('helmet');
const express = require('express');
const cron = require('node-cron');
const qrcode = require("qrcode-terminal");
const bodyParser = require('body-parser');
const routes = require('./src/routes/index');

// Make sure .env values are loaded
require("dotenv").config();

// Check database connection
checkDatabaseConnection();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Middleware
app.use(helmet());
app.use(bodyParser.json());
app.set('trust proxy', true);
app.use(express.static(path.join(__dirname, 'src/public')));

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

    // Start the Express server after the WhatsApp client is ready
    server.listen(PORT, () => {
        console.log(`Wazuh webhook receiver listening on port ${PORT}`);
    });
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
            await adminHandler(client, message, args);
        }
    } else {
        const userHandler = userCommands[command];
        if (userHandler) {
            await userHandler(message, args);
        }
    }
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

// Initialize the client
client.initialize();

routes(app, client, groups, io);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/index.html'));
});

// Serve summary.html
app.get('/summary', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public/summary.html'));
});

