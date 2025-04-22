const { handleServerStatus, handleMonitorCommand, handleThresholdCommand } = require('../src/controllers/systemMonitorController');
const { getSystemStats, startMonitoring, stopMonitoring, THRESHOLDS } = require('../src/models/systemMonitor');
const logger = require('../src/helpers/logger');

jest.mock('../src/models/systemMonitor');
jest.mock('../src/helpers/logger');

describe('handleServerStatus', () => {
    let client, message;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn(),
                sendStateTyping: jest.fn(),
            }),
        };

        message = {
            from: 'testUser',
            reply: jest.fn(),
        };

        jest.spyOn(logger, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should send system statistics', async () => {
        getSystemStats.mockResolvedValue({
            stats: {
                cpu: 'CPU: 20%',
                memory: 'Memory: 50%',
                storage: 'Storage: 70%',
            },
            hasAlerts: false,
        });

        await handleServerStatus(client, message);

        const chat = await client.getChatById.mock.results[0].value;
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();

        expect(message.reply).toHaveBeenCalledWith(
            'System Statistics\n\nCPU: 20%\nMemory: 50%\nStorage: 70%'
        );
    });

    it('should send system alerts if there are any', async () => {
        getSystemStats.mockResolvedValue({
            stats: {
                cpu: 'CPU: 20%',
                memory: 'Memory: 50%',
                storage: 'Storage: 70%',
            },
            hasAlerts: true,
            alerts: ['CPU usage high', 'Memory usage high'],
        });

        await handleServerStatus(client, message);

        const chat = await client.getChatById.mock.results[0].value;
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();

        expect(message.reply).toHaveBeenNthCalledWith(1,
            'System Statistics\n\nCPU: 20%\nMemory: 50%\nStorage: 70%'
        );
        expect(message.reply).toHaveBeenNthCalledWith(2,
            'System Alert\n\nCPU usage high\nMemory usage high'
        );
    });

    it('should handle errors and log them', async () => {
        const error = new Error('Test error');
        getSystemStats.mockRejectedValue(error);

        await handleServerStatus(client, message);

        expect(logger.error).toHaveBeenCalledWith('Error getting system statistics:', error);
        expect(message.reply).toHaveBeenCalledWith('Error getting system statistics');
    });
});

describe('handleMonitorCommand', () => {
    let client, message;

    beforeEach(() => {
        client = {};
        message = {
            from: 'testUser',
            reply: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should reply with usage instructions if no arguments are provided', async () => {
        await handleMonitorCommand(client, message, []);

        expect(message.reply).toHaveBeenCalledWith(
            "Usage:\n" +
            "`!monitor start <interval>` - Start monitoring (interval in minutes, default *5 minutes*)\n" +
            "`!monitor stop` - Stop monitoring"
        );
    });

    it('should start monitoring with default interval if no interval is provided', async () => {
        await handleMonitorCommand(client, message, ['start']);

        expect(startMonitoring).toHaveBeenCalledWith(client, 'testUser', undefined);
        expect(message.reply).toHaveBeenCalledWith(
            `System monitoring started\n\n` +
            `⏱️ Interval: *5 minutes*\n\n` +
            `🔄 The bot will check every *5 minutes*.\n\n` +
            `⚠️ You will receive alerts if any thresholds are *exceeded*.`
        );
    });

    it('should start monitoring with specified interval', async () => {
        await handleMonitorCommand(client, message, ['start', '10']);

        expect(startMonitoring).toHaveBeenCalledWith(client, 'testUser', 10 * 60 * 1000);
        expect(message.reply).toHaveBeenCalledWith(
            `System monitoring started\n\n` +
            `⏱️ Interval: *10 minutes*\n\n` +
            `🔄 The bot will check every *10 minutes*.\n\n` +
            `⚠️ You will receive alerts if any thresholds are *exceeded*.`
        );
    });

    it('should stop monitoring', async () => {
        await handleMonitorCommand(client, message, ['stop']);

        expect(stopMonitoring).toHaveBeenCalled();
        expect(message.reply).toHaveBeenCalledWith('Monitoring stopped.');
    });

    it('should reply with usage instructions if invalid action is provided', async () => {
        await handleMonitorCommand(client, message, ['invalid']);

        expect(message.reply).toHaveBeenCalledWith(
            "Usage:\n" +
            "`!monitor start <interval>` - Start monitoring (interval in minutes, default 5)\n" +
            "`!monitor stop` - Stop monitoring"
        );
    });
});

describe('handleThresholdCommand', () => {
    let client, message;

    beforeEach(() => {
        client = {};
        message = {
            from: 'testUser',
            reply: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should reply with usage instructions if arguments length is not 3', async () => {
        await handleThresholdCommand(client, message, ['cpu', 'warning']);
        
        expect(message.reply).toHaveBeenCalledWith(
            "Usage:\n`!threshold <cpu|memory|storage> <warning|critical> <value>`\n\n" +
            "Example:\n`!threshold cpu warning 70`"
        );
    });

    it('should reply with error if value is not a number', async () => {
        await handleThresholdCommand(client, message, ['cpu', 'warning', 'abc']);
        
        expect(message.reply).toHaveBeenCalledWith("Value must be between 0 and 100");
    });

    it('should reply with error if value is out of range', async () => {
        await handleThresholdCommand(client, message, ['cpu', 'warning', '150']);
        
        expect(message.reply).toHaveBeenCalledWith("Value must be between 0 and 100");
    });

    it('should set the threshold and reply with confirmation', async () => {
        THRESHOLDS.cpu = { warning: 50, critical: 80 };
        
        await handleThresholdCommand(client, message, ['cpu', 'warning', '70']);
        
        expect(THRESHOLDS.cpu.warning).toBe(70);
        expect(message.reply).toHaveBeenCalledWith("cpu warning threshold set to *70%*");
    });

    it('should reply with error if resource or level is invalid', async () => {
        await handleThresholdCommand(client, message, ['invalidResource', 'warning', '70']);
        
        expect(message.reply).toHaveBeenCalledWith("Invalid resource or level.");
    });
});