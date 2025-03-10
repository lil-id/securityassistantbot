const { handleServerStatus } = require('../src/controllers/systemMonitorController');
const { getSystemStats } = require('../src/models/systemMonitor');
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
