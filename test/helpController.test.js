const { handleHelp } = require('../src/controllers/helpController');
const logger = require('../src/helpers/logger');
const { checkRoles } = require('../src/helpers/rolesChecker');
const { adminHelpMessage, userHelpMessage } = require('../src/views/responseMessage');

jest.mock('../src/helpers/logger');
jest.mock('../src/helpers/rolesChecker');
jest.mock('../src/views/responseMessage');

describe('handleHelp', () => {
    let client, message, chat;

    beforeEach(() => {
        chat = {
            sendSeen: jest.fn().mockResolvedValue(),
            sendStateTyping: jest.fn().mockResolvedValue(),
            pin: jest.fn().mockResolvedValue()
        };

        client = {
            getChatById: jest.fn().mockResolvedValue(chat)
        };

        message = {
            from: 'testUser',
            author: 'testAuthor',
            reply: jest.fn().mockResolvedValue(),
            getChat: jest.fn().mockResolvedValue(chat)
        };

        logger.info.mockClear();
        logger.error.mockClear();
        checkRoles.mockClear();
    });

    it('should send admin help message and pin chat for admin role', async () => {
        checkRoles.mockResolvedValue({ role: 'admin' });
        await handleHelp(client, message, []);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith("Help command requested.");
        expect(checkRoles).toHaveBeenCalledWith(message.author);
        expect(message.reply).toHaveBeenCalledWith(adminHelpMessage);
        expect(message.getChat).toHaveBeenCalled();
        expect(chat.pin).toHaveBeenCalled();
    });

    it('should send user help message and pin chat for non-admin role', async () => {
        checkRoles.mockResolvedValue({ role: 'user' });
        await handleHelp(client, message, []);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith("Help command requested.");
        expect(checkRoles).toHaveBeenCalledWith(message.author);
        expect(message.reply).toHaveBeenCalledWith(userHelpMessage);
        expect(message.getChat).toHaveBeenCalled();
        expect(chat.pin).toHaveBeenCalled();
    });

    it('should log error if an exception occurs', async () => {
        const error = new Error('Test error');
        client.getChatById.mockRejectedValue(error);

        await handleHelp(client, message, []);

        expect(logger.error).toHaveBeenCalledWith("Error in handleHelp:", error);
    });
});