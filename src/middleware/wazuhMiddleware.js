const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const API_KEY = process.env.WAZUH_API_KEY; // Load API key from env

// Middleware to validate API key
const apiKeyMiddleware = (req, res, next) => {
    const providedKey = req.headers["x-api-key"]; // Get API key from headers

    if (!providedKey || providedKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized: Invalid API Key" });
    }

    next();
};

module.exports = { apiKeyMiddleware };