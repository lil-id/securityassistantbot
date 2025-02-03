const { reportBot } = require('../models/reportModel');
const { checkRoles } = require('../models/users/userModel');
const { responseMessages } = require('../views/responseMessage');

async function handleReport(message, args) {
    const reportMessage = args.join(' ');
    const phoneNumbers = message.mentionedIds.length > 0 ? message.mentionedIds : [message.from];
    const getRole = await checkRoles(message.author);
    const getMentionsNames = await message.getMentions();
    const names = getMentionsNames.map(contact => contact.name || 'Unknown').join(', ');

    const evidence = message._data.quotedMsg && message._data.quotedMsg.body
        ? message._data.quotedMsg.body
        : "No evidence provided";

    if (getRole && getRole.role === "admin") {
        if (reportMessage.toLowerCase() === "all") {
            const reports = await reportBot.getReports();
            await message.reply(`All reports:\n\n${reports}`);
            return;
        } else if (phoneNumbers.length > 0) {
            const reports = await reportBot.getReportById(phoneNumbers);
            await message.reply(`Reports for specified numbers:\n\n${reports}`);
            return;
        } else {
            await message.reply(responseMessages.invalidFormat);
            return;
        }
    }

    if (!reportMessage) {
        await message.reply(responseMessages.noReportDetails);
        return;
    }

    await reportBot.createReport(message.from, reportMessage);
    await message.reply(`Report from ${names}:\n\n${reportMessage}`);
}

module.exports = { handleReport };