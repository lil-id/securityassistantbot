const { exec } = require('child_process');

async function handleSnapshot(client, message, args) {
    await message.reply("Creating system snapshot...");
    exec('bash src/scripts/systemSnapshot.sh', { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error creating snapshot: ${error.message}`);
            message.reply(`Error creating snapshot: ${error.message}`);
            return;
        }
        console.log("Successfully created and uploaded snapshot to GCP Cloud Storage.");
        message.reply("Successfully created and uploaded snapshot to GCP Cloud Storage.");
    });
}

module.exports = { handleSnapshot };