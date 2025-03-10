const { exec } = require("child_process");
const logger = require("../helpers/logger");
const { prisma } = require("../helpers/databaseConnection");
const { startCronJob, validateCronSchedule } = require("../helpers/cronHelper");
const { appState } = require("../../app");

async function handleSnapshot(client, message, args, groups) {
    if (args.length === 0) {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();
        
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

                if (stderr) {
                    logger.warn(`Snapshot script warning: ${stderr}`);
                }
                
                logger.info("Successfully created and uploaded snapshot to Cloud Storage.");
                message.reply("Successfully created and uploaded snapshot to Cloud Storage.");
            }
        );
    } else if (args.length >= 1 && args.length <= 6) {
        const newSchedule = args.map(part => (part === '' ? '*' : part)).join(' ');

        if (!validateCronSchedule(newSchedule)) {
            await message.reply("Invalid cron schedule format.\nExample: !snap 59 23 * * *");
            return;
        }

        // Stop the existing cron job
        if (appState.cronJobRef.current) {
            appState.cronJobRef.current.stop();
        }        

        // Start a new cron job with the new schedule
        appState.cronJobRef.current = startCronJob(newSchedule, client, groups);

        // Parse the cron schedule
        const [minute, hour, dayOfMonth, month, dayOfWeek] = newSchedule.split(" ");

        // Store the new cron schedule in the database
        await prisma.cronJobsSchedule.upsert({
            where: { id: 1 },
            update: {
                hourMinute: `${minute} ${hour}`,
                dayOfMonth,
                month,
                dayOfWeek,
            },
            create: {
                id: 1,
                hourMinute: `${minute} ${hour}`,
                dayOfMonth,
                month,
                dayOfWeek,
            },
        });

        logger.info(`Cron schedule successfully updated to: ${newSchedule}`);
        await message.reply(`Cron schedule successfully updated to: ${newSchedule}`);
    } else {
        await message.reply("Usage: !snap <cron_schedule>\nExample: !snap 59 23 * * *");
    }
}

module.exports = { handleSnapshot };
