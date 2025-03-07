const fs = require("fs");
const path = require("path");
const logger = require("../helpers/logger");

// Get the correct path dynamically
const knownAccountsFile = path.join(
    __dirname,
    "../public/knownSystemAccounts.txt"
);

// Get all system accounts from /etc/passwd
const getAllAccounts = () => {
    try {
        logger.info("Reading /etc/passwd file...");
        const passwdData = fs.readFileSync("/etc/passwd", "utf-8");
        return passwdData
            .split("\n")
            .map((line) => {
                const fields = line.split(":");
                if (fields.length > 1) {
                    return {
                        username: fields[0],
                        uid: parseInt(fields[2], 10),
                        home: fields[5],
                        shell: fields[6],
                        isSuspicious: isSuspiciousAccount(fields[0]),
                    };
                }
                return null;
            })
            .filter((account) => account !== null);
    } catch (error) {
        logger.error("Error reading /etc/passwd:", error);
        return [];
    }
};

// Load known system accounts
const getKnownAccounts = () => {
    logger.info(`Reading known accounts from ${knownAccountsFile}...`);
    if (!fs.existsSync(knownAccountsFile)) {
        logger.warn(
            `[Warning] ${knownAccountsFile} not found! Running script may be required.`
        );
        return new Set(); // Return empty set if the file is missing
    }

    const accounts = fs
        .readFileSync(knownAccountsFile, "utf-8")
        .split("\n")
        .map((line) => line.trim());
    return new Set(accounts.filter((account) => account.length > 0)); // Remove empty lines
};

// Function to check if an account is suspicious
const isSuspiciousAccount = (account) => {
    logger.info(`Checking if account ${account} is suspicious...`);
    const knownAccounts = getKnownAccounts();
    return !knownAccounts.has(account);
};

module.exports = { getKnownAccounts, isSuspiciousAccount, getAllAccounts };
