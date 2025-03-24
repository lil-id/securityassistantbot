const { exec } = require('child_process');
const util = require('util');
const { alertChecker } = require('../helpers/alertChecker');
const execPromise = util.promisify(exec);
const logger = require('../helpers/logger');

// Alert thresholds
const THRESHOLDS = {
    cpu: {
        warning: 70,    // 70% CPU usage
        critical: 90    // 90% CPU usage
    },
    memory: {
        warning: 80,    // 80% Memory usage
        critical: 90    // 90% Memory usage
    },
    storage: {
        warning: 80,    // 80% Storage usage
        critical: 90    // 90% Storage usage
    }
};

// Get CPU Usage with threshold check
async function getCPUUsage() {
    logger.info('Getting CPU usage');
    try {
        const { stdout } = await execPromise("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        const cpuUsage = parseFloat(stdout);
        const alertLevel = alertChecker.getAlertLevel(cpuUsage, THRESHOLDS.cpu);
        
        return {
            value: cpuUsage.toFixed(1),
            alert: alertLevel,
            formattedString: `${alertChecker.getAlertEmoji(alertLevel)} *CPU Usage*: ${cpuUsage.toFixed(1)}%`
        };
    } catch (error) {
        logger.error('Error getting CPU usage:', error);
        return {
            value: null,
            alert: 'error',
            formattedString: 'CPU Usage: Error reading'
        };
    }
}

// Get Memory Usage with threshold check
async function getMemoryUsage() {
    logger.info('Getting Memory usage');
    try {
        const { stdout: totalMem } = await execPromise("free | grep 'Mem:' | awk '{print $2}'");
        const { stdout: usedMem } = await execPromise("free | grep 'Mem:' | awk '{print $3}'");
        
        const total = parseInt(totalMem);
        const used = parseInt(usedMem);
        const percentUsed = parseFloat((used / total * 100).toFixed(1)); 
        const alertLevel = alertChecker.getAlertLevel(percentUsed, THRESHOLDS.memory);

        // Get human readable values
        const { stdout } = await execPromise("free -h | grep 'Mem:'");
        const parts = stdout.split(/\s+/);

        return {
            value: percentUsed,
            alert: alertLevel,
            total: parts[1],
            used: parts[2],
            free: parts[3],
            formattedString: `${alertChecker.getAlertEmoji(alertLevel)} *Memory*: ${parts[2]} used of ${parts[1]} (${percentUsed}%)`
        };
    } catch (error) {
        logger.error('Error getting memory usage:', error);
        return {
            value: null,
            alert: 'error',
            formattedString: 'Memory Usage: Error reading'
        };
    }
}

// Get Storage Usage with threshold check
async function getStorageUsage() {
    logger.info('Getting Storage usage');
    try {
        const { stdout } = await execPromise("df -h / | tail -n 1");
        const parts = stdout.split(/\s+/);
        const percentUsed = parseInt(parts[4]);
        const alertLevel = alertChecker.getAlertLevel(percentUsed, THRESHOLDS.storage);

        return {
            value: percentUsed,
            alert: alertLevel,
            total: parts[1],
            used: parts[2],
            available: parts[3],
            formattedString: `${alertChecker.getAlertEmoji(alertLevel)} *Storage*: ${parts[2]} used of ${parts[1]} (${parts[4]})`
        };
    } catch (error) {
        logger.error('Error getting storage usage:', error);
        return {
            value: null,
            alert: 'error',
            formattedString: 'Storage Usage: Error reading'
        };
    }
}

// Function to get all system stats with alerts
async function getSystemStats() {
    try {
        logger.info("Getting system stats");
        
        // Get all stats in parallel
        const [cpu, memory, storage] = await Promise.all([
            getCPUUsage(),
            getMemoryUsage(),
            getStorageUsage()
        ]);

        // Check if any errors occurred
        if (cpu.alert === 'error' || memory.alert === 'error' || storage.alert === 'error') {
            throw new Error("Failed to get system stats");
        }

        const stats = {
            cpu: cpu.formattedString,
            memory: memory.formattedString,
            storage: storage.formattedString
        };

        // Collect alerts
        const alerts = [];
        if (cpu.alert !== 'normal') alerts.push(cpu.formattedString);
        if (memory.alert !== 'normal') alerts.push(memory.formattedString);
        if (storage.alert !== 'normal') alerts.push(storage.formattedString);

        return {
            stats,
            alerts,
            hasAlerts: alerts.length > 0
        };
    } catch (error) {
        logger.error("Error getting system stats:", error);
        return {
            stats: "Error reading system statistics",
            alerts: [],
            hasAlerts: false
        };
    }
}

// Periodic monitoring function
let monitorInterval = null;

function startMonitoring(client, adminNumber, interval = 5 * 60 * 1000) { // Default 5 minutes
    logger.info('Starting system monitoring');
    if (monitorInterval) {
        clearInterval(monitorInterval);
    }

    monitorInterval = setInterval(async () => {
        try {
            const result = await getSystemStats();
            if (result.hasAlerts) {
                const alertMessage = `Automated System Alert\n\n${result.alerts.join('\n')}`;
                await client.sendMessage(adminNumber, alertMessage);
            }
        } catch (error) {
            logger.error('Monitoring error:', error);
        }
    }, interval);
}

function stopMonitoring() {
    logger.info('Stopping system monitoring');
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}

// Export functions
module.exports = {
    getCPUUsage,
    getMemoryUsage,
    getStorageUsage,
    getSystemStats,
    startMonitoring,
    stopMonitoring,
    THRESHOLDS
};