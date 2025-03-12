const cron = require("node-cron");
const logger = require("../helpers/logger");
const { exec } = require("child_process");

function startCronJob(schedule, client, groups) {
    const newSchedule = validateCronSchedule(schedule);

    if (!newSchedule) {
        throw new Error("Invalid cron schedule");
    }

    // Split schedule into parts
    let parts = schedule.trim().split(/\s+/);

    // If less than 5 parts, append asterisks to make it valid
    while (parts.length < 5) {
        parts.push("*");
    }

    // Join and validate
    const fixedSchedule = parts.join(" ");

    const job = cron.schedule(fixedSchedule, () => {
        logger.info("Running scheduled system snapshot...");
        client.sendMessage(
            groups.member,
            "Running scheduled system snapshot..."
        );

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

    return job;
}

function validateCronSchedule(schedule) {
    // Split schedule into parts
    let parts = schedule.trim().split(/\s+/);

    // If less than 5 parts, append asterisks to make it valid
    while (parts.length < 5) {
        parts.push("*");
    }

    // Join and validate
    const fixedSchedule = parts.join(" ");
    return cron.validate(fixedSchedule);
}

module.exports = { startCronJob, validateCronSchedule };
