function formatAccountInfo(account) {
    return `👤 *${account.username}*\n` +
           `📌 UID: ${account.uid}\n` +
           `🏠 Home: ${account.homeDir}\n` +
           `🖥️ Shell: ${account.shell}\n` +
           `👥 Groups: ${account.groups && account.groups.length ? account.groups.join(', ') : 'None'}\n` +
           `⏳ Last Login: ${account.lastLogin || 'Unknown'}\n` +
           (account.isSuspicious ? '⚠️ *Suspicious Account Detected!* ⚠️\n' : '');
}

module.exports = { formatAccountInfo };
