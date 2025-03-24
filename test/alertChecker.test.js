const { alertChecker } = require('../src/helpers/alertChecker');

describe('alertChecker', () => {
    describe('getAlertLevel', () => {
        it('should return "critical" when value is greater than or equal to critical threshold', () => {
            const threshold = { critical: 90, warning: 50 };
            expect(alertChecker.getAlertLevel(95, threshold)).toBe('critical');
            expect(alertChecker.getAlertLevel(90, threshold)).toBe('critical');
        });

        it('should return "warning" when value is greater than or equal to warning threshold but less than critical threshold', () => {
            const threshold = { critical: 90, warning: 50 };
            expect(alertChecker.getAlertLevel(70, threshold)).toBe('warning');
            expect(alertChecker.getAlertLevel(50, threshold)).toBe('warning');
        });

        it('should return "normal" when value is less than warning threshold', () => {
            const threshold = { critical: 90, warning: 50 };
            expect(alertChecker.getAlertLevel(30, threshold)).toBe('normal');
        });
    });

    describe('getAlertEmoji', () => {
        it('should return "🙀" for "critical" alert level', () => {
            expect(alertChecker.getAlertEmoji('critical')).toBe('🙀');
        });

        it('should return "😿" for "warning" alert level', () => {
            expect(alertChecker.getAlertEmoji('warning')).toBe('😿');
        });

        it('should return "😸" for "normal" alert level', () => {
            expect(alertChecker.getAlertEmoji('normal')).toBe('😸');
        });

        it('should return "😾" for unknown alert level', () => {
            expect(alertChecker.getAlertEmoji('unknown')).toBe('😾');
        });
    });
});