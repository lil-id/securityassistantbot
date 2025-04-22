const { handleInfo } = require('../src/controllers/infoController');
const logger = require('../src/helpers/logger');

jest.mock('../src/helpers/logger');

describe('handleInfo', () => {
    let client, message, chat;

    beforeEach(() => {
        chat = {
            sendSeen: jest.fn(),
            sendStateTyping: jest.fn()
        };

        client = {
            getChatById: jest.fn().mockResolvedValue(chat)
        };

        message = {
            from: 'testUser',
            reply: jest.fn()
        };

        logger.info.mockClear();
        logger.error.mockClear();
    });

    it('should send seen and typing state, log info, and reply with bot info', async () => {
        await handleInfo(client, message);

        expect(client.getChatById).toHaveBeenCalledWith('testUser');
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith('Morning Star (Monsta) v1.0');
        expect(message.reply).toHaveBeenCalledWith('Morning Star (Monsta) v1.0\nCreated by lil-id');
    });

    it('should log error and reply with error message if an error occurs', async () => {
        const error = new Error('Test error');
        client.getChatById.mockRejectedValue(error);

        await handleInfo(client, message);

        expect(logger.error).toHaveBeenCalledWith('Error getting info:', error);
        expect(message.reply).toHaveBeenCalledWith(`Error: ${error.message}`);
    });
});