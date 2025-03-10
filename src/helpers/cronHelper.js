const cron = require("node-cron");
const logger = require("../helpers/logger");
const { exec } = require("child_process");

function startCronJob(schedule, client, groups) {
    if (!cron.validate(schedule)) {
        throw new Error("Invalid cron schedule");
    }

    const job = cron.schedule(schedule, () => {
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
                logger.info("Successfully created and uploaded snapshot to Cloud Storage.");
                client.sendMessage(groups.member, "Successfully created and uploaded snapshot to Cloud Storage.");
                client.sendMessage(groups.member, "Scheduled system snapshot completed.");
            }
        );
    });

    return job;
}


function validateCronSchedule(schedule) {
    return cron.validate(schedule);
}

module.exports = { startCronJob, validateCronSchedule };
