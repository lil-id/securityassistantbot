const { exec } = require("child_process");
const logger = require("../helpers/logger");
const cron = require("node-cron");
const { prisma } = require("../helpers/databaseConnection");

// Function to start the cron job
function startCronJob(schedule, client, groups) {
    return cron.schedule(schedule, () => {
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
}

async function handleSnapshot(client, message, args, groups, cronJob) {
    logger.info("Creating system snapshot...");
    await message.reply("Creating system snapshot...");
    exec(
        "bash src/scripts/systemSnapshot.sh",
        { maxBuffer: 1024 * 1024 * 10 },
        (error, stdout, stderr) => {
            if (error) {
                logger.error(`Error creating snapshot: ${error.message}`);
                message.reply(`Error creating snapshot: ${error.message}`);
                return;
            }
            logger.info(
                "Successfully created and uploaded snapshot to Cloud Storage."
            );
            message.reply(
                "Successfully created and uploaded snapshot to Cloud Storage."
            );
        }
    );

    if (args.length !== 1) {
        await message.reply(
            "Usage: !snap <cron_schedule>\nExample: !snap '59 23 * * *'"
        );
        return;
    }

    const newSchedule = args[0];

    try {
        // Validate the new cron schedule
        cron.validate(newSchedule);

        // Stop the existing cron job
        cronJob.stop();

        // Start a new cron job with the new schedule
        cronJob = startCronJob(newSchedule, client, groups);

        // Parse the cron schedule
        const [minute, hour, dayOfMonth, month, dayOfWeek] =
            newSchedule.split(" ");

        // Store the new cron schedule in the database
        await prisma.cronJobsSchedule.update({
            where: { id: 1 },
            data: { 
                hour: `${hour}:${minute}`,
                dayOfMonth,
                month,
                dayOfWeek,
             },
        });

        logger.info(`Cron schedule successfully updated to: ${newSchedule}`);

        await message.reply(`Cron schedule successfully updated to: ${newSchedule}`);
    } catch (error) {
        await message.reply(
            "Invalid cron schedule format.\nExample: !setCron '59 23 * * *'"
        );
    }
}

module.exports = { handleSnapshot, startCronJob };
