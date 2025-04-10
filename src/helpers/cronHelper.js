const cron = require("node-cron");
const logger = require("../helpers/logger");
const { exec } = require("child_process");

function startCronJob(schedule, client, groups) {
    const newSchedule = validateCronSchedule(schedule);

    if (!newSchedule) {
        throw new Error("Invalid cron schedule");
    }

    console.log(newSchedule);
    const job = cron.schedule(newSchedule, () => {
        logger.info("Running scheduled system snapshot...");
        client.sendMessage(
            groups.member,
            "⏳ Running scheduled system snapshot..."
        );

        exec(
            "sh src/scripts/systemSnapshot.sh",
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
                    "✅ Scheduled system snapshot completed."
                );
            }
        );
    });

    return job;
}

function validateCronSchedule(schedule) {
    // Split schedule into parts and replace "null" with "*"
    let parts = schedule.trim().split(/\s+/).map(part => part === "null" ? "*" : part);

    // Ensure it has exactly 5 parts
    while (parts.length < 5) {
        parts.push("*");
    }

    const fixedSchedule = parts.join(" ");

    // Validate the cron schedule
    if (!cron.validate(fixedSchedule)) {
        return false;
    }

    // Convert WITA (UTC+8) to UTC
    const [minute, hour, day, month, dayOfWeek] = parts;
    const utcHour = hour === "*" ? "*" : (parseInt(hour) - 8 + 24) % 24; // Adjust hour for UTC
    const utcSchedule = `${minute} ${utcHour} ${day} ${month} ${dayOfWeek}`;

    return utcSchedule;
}

module.exports = { startCronJob, validateCronSchedule };
