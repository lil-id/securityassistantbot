class alertChecker {
    // Helper function to determine alert level
    static getAlertLevel(value, threshold) {
        if (value >= threshold.critical) return 'critical';
        if (value >= threshold.warning) return 'warning';
        return 'normal';
    }

    // Helper function to get emoji for alert level
    static getAlertEmoji(alertLevel) {
        switch (alertLevel) {
            case 'critical': return '🙀';
            case 'warning': return '😿';
            case 'normal': return '😸';
            default: return '😾';
        }
    }
}

module.exports = { alertChecker };