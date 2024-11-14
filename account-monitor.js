const { Client, LocalAuth } = require('whatsapp-web.js');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

// Store previous account state
let previousAccounts = new Map();

// Suspicious patterns in usernames
const SUSPICIOUS_PATTERNS = [
    'tmp', 'temp', 'test', 'hack', 'exploit', 'daemon',
    'null', 'none', 'empty', 'backdoor', 'ghost'
];

// System accounts to ignore (can be customized)
const SYSTEM_ACCOUNTS = new Set([
    'root', 'daemon', 'bin', 'sys', 'sync', 'games', 'man', 'lp', 'mail',
    'news', 'uucp', 'proxy', 'www-data', 'backup', 'list', 'irc', 'gnats',
    'nobody', 'systemd-network', 'systemd-resolve', 'syslog', 'messagebus',
    '_apt', 'systemd-timesync', 'systemd-coredump'
]);

class UserAccount {
    constructor(username, uid, gid, groups, shell, lastLogin, homeDir) {
        this.username = username;
        this.uid = uid;
        this.gid = gid;
        this.groups = groups;
        this.shell = shell;
        this.lastLogin = lastLogin;
        this.homeDir = homeDir;
        this.isSuspicious = this.checkSuspicious();
    }

    checkSuspicious() {
        // Check for suspicious patterns
        const lowercaseUsername = this.username.toLowerCase();
        if (SUSPICIOUS_PATTERNS.some(pattern => lowercaseUsername.includes(pattern))) {
            return true;
        }

        // Check for numeric-only usernames
        if (/^\d+$/.test(this.username)) {
            return true;
        }

        // Check for unusual shells
        const normalShells = ['/bin/bash', '/bin/sh', '/bin/dash', '/bin/false', '/usr/sbin/nologin'];
        if (!normalShells.includes(this.shell)) {
            return true;
        }

        // Check for unusual UIDs
        const uid = parseInt(this.uid);
        if (uid < 1000 && !SYSTEM_ACCOUNTS.has(this.username)) {
            return true;
        }

        return false;
    }
}

// Get detailed account information
async function getAccountDetails() {
    try {
        // Get all users from /etc/passwd
        const { stdout: passwdContent } = await execPromise('cat /etc/passwd');
        const { stdout: shadowLastLogin } = await execPromise('last -n 50');
        const { stdout: groupContent } = await execPromise('cat /etc/group');

        // Parse group information
        const groupMap = new Map();
        groupContent.split('\n').forEach(line => {
            if (line) {
                const [groupName, , groupId, members] = line.split(':');
                groupMap.set(groupId, {
                    name: groupName,
                    members: members ? members.split(',') : []
                });
            }
        });

        // Create a map of username to last login
        const lastLoginMap = new Map();
        shadowLastLogin.split('\n').forEach(line => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3) {
                const username = parts[0];
                const lastLogin = parts.slice(2, 5).join(' ');
                lastLoginMap.set(username, lastLogin);
            }
        });

        // Parse user accounts
        const accounts = new Map();
        const lines = passwdContent.split('\n');

        for (const line of lines) {
            if (!line) continue;

            const [username, , uid, gid, , homeDir, shell] = line.split(':');
            
            // Get groups for this user
            const userGroups = [];
            groupMap.forEach((group, groupId) => {
                if (group.members.includes(username)) {
                    userGroups.push(group.name);
                }
            });

            // Create user account object
            const account = new UserAccount(
                username,
                uid,
                gid,
                userGroups,
                shell,
                lastLoginMap.get(username) || 'Never',
                homeDir
            );

            accounts.set(username, account);
        }

        return accounts;
    } catch (error) {
        console.error('Error getting account details:', error);
        throw error;
    }
}

// Check for account changes
async function checkAccountChanges(currentAccounts) {
    const changes = {
        added: [],
        removed: [],
        modified: [],
        suspicious: []
    };

    // First run
    if (previousAccounts.size === 0) {
        previousAccounts = new Map(currentAccounts);
        // Check for suspicious accounts on first run
        currentAccounts.forEach(account => {
            if (account.isSuspicious) {
                changes.suspicious.push(account);
            }
        });
        return changes;
    }

    // Check for changes
    currentAccounts.forEach((account, username) => {
        const prevAccount = previousAccounts.get(username);
        if (!prevAccount) {
            changes.added.push(account);
        } else if (JSON.stringify(account) !== JSON.stringify(prevAccount)) {
            changes.modified.push({
                current: account,
                previous: prevAccount
            });
        }
        if (account.isSuspicious) {
            changes.suspicious.push(account);
        }
    });

    // Check for removed accounts
    previousAccounts.forEach((account, username) => {
        if (!currentAccounts.has(username)) {
            changes.removed.push(account);
        }
    });

    // Update previous state
    previousAccounts = new Map(currentAccounts);
    return changes;
}

// Format account information for WhatsApp message
function formatAccountInfo(account) {
    return `👤 *${account.username}*\n` +
           `UID: ${account.uid}\n` +
           `Shell: ${account.shell}\n` +
           `Groups: ${account.groups.join(', ') || 'None'}\n` +
           `Last Login: ${account.lastLogin}\n` +
           `Home: ${account.homeDir}\n` +
           (account.isSuspicious ? '⚠️ *Suspicious Account*\n' : '');
}

// Handler for WhatsApp bot
async function handleAccountCheck(message, args) {
    try {
        const accounts = await getAccountDetails();
        const changes = await checkAccountChanges(accounts);

        let response = '📊 *Account Status Report*\n\n';

        // Report new accounts
        if (changes.added.length > 0) {
            response += '🆕 *New Accounts:*\n';
            changes.added.forEach(account => {
                response += formatAccountInfo(account) + '\n';
            });
        }

        // Report suspicious accounts
        if (changes.suspicious.length > 0) {
            response += '⚠️ *Suspicious Accounts:*\n';
            changes.suspicious.forEach(account => {
                response += formatAccountInfo(account) + '\n';
            });
        }

        // Report removed accounts
        if (changes.removed.length > 0) {
            response += '❌ *Removed Accounts:*\n';
            changes.removed.forEach(account => {
                response += `- ${account.username}\n`;
            });
        }

        // If no changes, show summary
        if (!changes.added.length && !changes.removed.length && !changes.suspicious.length) {
            response += '✅ No suspicious activity detected\n\n';
            response += `Total Accounts: ${accounts.size}\n`;
            response += `System Accounts: ${[...accounts.values()].filter(a => a.uid < 1000).length}\n`;
            response += `User Accounts: ${[...accounts.values()].filter(a => a.uid >= 1000).length}\n`;
        }

        await message.reply(response);

        // Send detailed report to admin if suspicious activity found
        if (changes.suspicious.length > 0 && message.from !== process.env.ADMIN_NUMBER) {
            const adminAlert = '🚨 *Suspicious Account Activity Detected*\n\n' +
                             changes.suspicious.map(formatAccountInfo).join('\n');
            console.log(process.env.ADMIN_NUMBER, adminAlert);
            await client.sendMessage(process.env.ADMIN_NUMBER, adminAlert);
        }

    } catch (error) {
        console.error('Error in handleAccountCheck:', error);
        await message.reply('Error checking account status');
    }
}

// Periodic account monitoring
let accountMonitorInterval = null;

function startAccountMonitoring(client, adminNumber, interval = 15 * 60 * 1000) { // Default 15 minutes
    if (accountMonitorInterval) {
        clearInterval(accountMonitorInterval);
    }

    accountMonitorInterval = setInterval(async () => {
        try {
            const accounts = await getAccountDetails();
            const changes = await checkAccountChanges(accounts);

            // Send alert if there are any suspicious changes
            if (changes.added.length || changes.suspicious.length) {
                let alertMessage = '🚨 *Automated Account Monitor Alert*\n\n';
                
                if (changes.added.length) {
                    alertMessage += '🆕 *New Accounts Detected:*\n';
                    changes.added.forEach(account => {
                        alertMessage += formatAccountInfo(account) + '\n';
                    });
                }

                if (changes.suspicious.length) {
                    alertMessage += '⚠️ *Suspicious Accounts Detected:*\n';
                    changes.suspicious.forEach(account => {
                        alertMessage += formatAccountInfo(account) + '\n';
                    });
                }

                await client.sendMessage(adminNumber, alertMessage);
            }
        } catch (error) {
            console.error('Account monitoring error:', error);
        }
    }, interval);
}

function stopAccountMonitoring() {
    if (accountMonitorInterval) {
        clearInterval(accountMonitorInterval);
        accountMonitorInterval = null;
    }
}

module.exports = {
    getAccountDetails,
    checkAccountChanges,
    handleAccountCheck,
    startAccountMonitoring,
    stopAccountMonitoring
};