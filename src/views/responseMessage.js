const responseMessages = {
    invalidFormat: 'Please provide argument text.\n\nFormat:\n\n*!report all* - Get all reports \n*!report [userPhoneNumber]* - Get specific report',
    noReportDetails: 'Please provide report details.\nFormat: !report issue description',
    botTerminated: 'Bot terminated by Admin',
    noPermission: 'You do not have permission to terminate the bot.'
};

let adminHelpMessage = "*Admin commands*:\n\n";
adminHelpMessage += "`!ask` - Get security recommendation or ask AI\n";
adminHelpMessage += "`!admin` - Added new admin\n";
adminHelpMessage += "`!user` - Added new member\n";
adminHelpMessage += "`!server` - Check server status\n";
adminHelpMessage += "`!monitor` - Start monitoring server\n";
adminHelpMessage += "`!threshold` - Configure threshold\n";
adminHelpMessage += "`!account` - Check server accounts\n";
adminHelpMessage += "`!container` - Check container status\n";
adminHelpMessage += "`!snap` - Create snapshot\n";
adminHelpMessage += "`!hunt` - Get latest threat from ThreatFox\n";
adminHelpMessage += "`!botnet` - Check malicious IPs botnet\n";
adminHelpMessage += "`!malware` - Get latest malware list from ThreatFox\n";
adminHelpMessage += "`!summary` - View active response summary\n";
adminHelpMessage += "`!feedback` - View all feedback\n";
adminHelpMessage += "`!report` - View all issues\n";
adminHelpMessage += "`!history` - Get command history\n";
adminHelpMessage += "`!help` - Show this help message\n";
adminHelpMessage += "`!info` - Get bot information\n";
adminHelpMessage += "`!stop` - Terminate bot\n";

let userHelpMessage = "*User commands*:\n\n";
userHelpMessage += "`!ask` - Get security recommendation or ask AI\n";
userHelpMessage += "`!server` - Check server status\n";
userHelpMessage += "`!monitor` - Start monitoring server\n";
userHelpMessage += "`!account` - Check server accounts\n";
userHelpMessage += "`!container` - Check container status\n";
userHelpMessage += "`!snap` - Create snapshot\n";
userHelpMessage += "`!hunt` - Get latest threat from ThreatFox\n";
userHelpMessage += "`!botnet` - Check malicious IPs botnet\n";
userHelpMessage += "`!malware` - Get latest malware list from ThreatFox\n";
userHelpMessage += "`!summary` - View active response summary\n";
userHelpMessage += "`!feedback` - Create feedback\n";
userHelpMessage += "`!report` - Report issues\n";
userHelpMessage += "`!help` - Show this help message\n";
userHelpMessage += "`!info` - Get bot information\n";

module.exports = { responseMessages, adminHelpMessage, userHelpMessage };