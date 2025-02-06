const { exec } = require('child_process');
const logger = require('../helpers/logger');

async function handleSnapshot(client, message, args) {
    logger.info("Creating system snapshot...");
    await message.reply("Creating system snapshot...");
    exec('bash src/scripts/systemSnapshot.sh', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Error creating snapshot: ${error.message}`);
            message.reply(`Error creating snapshot: ${error.message}`);
            return;
        }
        logger.info("Successfully created and uploaded snapshot to Cloud Storage.");
        message.reply("Successfully created and uploaded snapshot to Cloud Storage.");
    });
}

module.exports = { handleSnapshot };