const { exec } = require("child_process");
const logger = require("../helpers/logger");
const { prisma } = require("../helpers/databaseConnection");
const { startCronJob, validateCronSchedule } = require("../helpers/cronHelper");

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
        await message.reply("If you want to schedule a snapshot at custom time, use\n\n📌 *Cron format:*\n`sec min hour day month week`\n🔢 *Value ranges:*\n- ⏳ Second: `0-59`\n- ⏰ Minute: `0-59`\n- 🕛 Hour: `0-23`\n- 📅 Day of Month: `1-31`\n- 🗓️ Month: `1-12` (or names)\n- 📆 Day of Week: `0-7` (or names, 0 & 7 = Sunday)\n\n✅ Example:\n`!snap 59 23 * * *` → Runs at *11:59 PM* daily");
    } else if (args.length >= 1 && args.length <= 6) {
        const newSchedule = args.map(part => (part === '' ? '*' : part)).join(' ');

        if (!validateCronSchedule(newSchedule)) {
            await message.reply("🕒 *Invalid cron format!*\n\n📌 *Correct format:*\n`sec min hour day month week`\n🔢 *Value ranges:*\n- ⏳ Second: `0-59`\n- ⏰ Minute: `0-59`\n- 🕛 Hour: `0-23`\n- 📅 Day of Month: `1-31`\n- 🗓️ Month: `1-12` (or names)\n- 📆 Day of Week: `0-7` (or names, 0 & 7 = Sunday)\n\n✅ Example:\n`!snap 59 23 * * *` → Runs at *11:59 PM* daily");
            return;
        }

        // Start a new cron job with the new schedule
        startCronJob(newSchedule, client, groups);

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
        await message.reply("📌 *Cron format:*\n`sec min hour day month week`\n🔢 *Value ranges:*\n- ⏳ Second: `0-59`\n- ⏰ Minute: `0-59`\n- 🕛 Hour: `0-23`\n- 📅 Day of Month: `1-31`\n- 🗓️ Month: `1-12` (or names)\n- 📆 Day of Week: `0-7` (or names, 0 & 7 = Sunday)\n\n✅ Example:\n`!snap 59 23 * * *` → Runs at *11:59 PM* daily");
    }
}

module.exports = { handleSnapshot };
