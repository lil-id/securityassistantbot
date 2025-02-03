const responseMessages = {
    invalidFormat: 'Please provide argument text.\n\nFormat:\n\n*!report all* - Get all reports \n*!report [userPhoneNumber]* - Get specific report',
    noReportDetails: 'Please provide report details.\nFormat: !report issue description',
    botTerminated: 'Bot terminated by Admin',
    noPermission: 'You do not have permission to terminate the bot.'
};

module.exports = { responseMessages };