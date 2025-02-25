const { reportBot } = require('../models/reportModel');
const { checkRoles } = require('../helpers/rolesChecker');

async function handleReport(client, message, args) {

    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    const reportMessage = args.join(" ");
    const phoneNumber = message.mentionedIds;

    const getRole = await checkRoles(message.author);
    const getMentionsNames = await message.getMentions();

    const names = getMentionsNames
        .map((contact) => contact.name || "Unknown")
        .join(", ");
    const evidence =
        message._data.quotedMsg && message._data.quotedMsg.body
            ? message._data.quotedMsg.body
            : "No evidence provided";

    if (getRole && getRole.role === "admin") {
        // Get all reports
        if (reportMessage.toLowerCase() === "all") {
            const reports = await reportBot.getReports();
            await message.reply(`All reports:\n\n${reports}`);
            return;
        }
        // Get report by phone number
        else if (phoneNumber.length > 0) {
            const report = await reportBot.getReportById(phoneNumber);
            await message.reply(`Report from ${names}:\n\n${report}`);
            return;
        }
        // No report message
        else if (!reportMessage) {
            await message.reply(
                "Please provide report details or provide argument text.\n\n*!report* issue description\n*!report all* - Get all reports \n*!report <userPhoneNumber>* - Get specific report"
            );
            return;
        }
        // Create report
        else {
            await reportBot.createReport(
                message.author,
                evidence,
                reportMessage
            );
            await message.reply(
                "Report received. We will investigate the issue."
            );
        }
    }
}

module.exports = { handleReport };