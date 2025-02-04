function formatAccountInfo(account) {
    return `👤 *${account.username}*\n` +
           `UID: ${account.uid}\n` +
           `Shell: ${account.shell}\n` +
           `Groups: ${account.groups.join(', ') || 'None'}\n` +
           `Last Login: ${account.lastLogin}\n` +
           `Home: ${account.homeDir}\n` +
           (account.isSuspicious ? '⚠️ *Suspicious Account*\n' : '');
}

module.exports = { formatAccountInfo };