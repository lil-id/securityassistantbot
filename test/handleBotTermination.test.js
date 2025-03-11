const { handleBotTermination } = require('../src/controllers/handleBotTermination');
const logger = require('../src/helpers/logger');
const { checkRoles } = require('../src/helpers/rolesChecker');
const { responseMessages } = require('../src/views/responseMessage');

jest.mock('../src/helpers/logger');
jest.mock('../src/helpers/rolesChecker');
jest.mock('../src/views/responseMessage');

describe('handleBotTermination', () => {
    let client;
    let message;

    beforeEach(() => {
        client = {
            getChatById: jest.fn().mockResolvedValue({
                sendSeen: jest.fn().mockResolvedValue(),
                sendStateTyping: jest.fn().mockResolvedValue(),
            }),
            logout: jest.fn().mockResolvedValue(),
        };

        message = {
            from: 'testUser',
            author: 'testAuthor',
            reply: jest.fn().mockResolvedValue(),
        };

        jest.spyOn(process, 'exit').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should terminate the bot if the user is an admin', async () => {
        checkRoles.mockResolvedValue({ role: 'admin' });
        responseMessages.botTerminated = 'Bot has been terminated';

        await handleBotTermination(client, message);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        const chat = await client.getChatById(message.from);
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();        
        expect(checkRoles).toHaveBeenCalledWith(message.author);
        expect(logger.info).toHaveBeenCalledWith('Bot termination requested by admin.');
        expect(message.reply).toHaveBeenCalledWith(responseMessages.botTerminated);
        expect(client.logout).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(0);
    });

    it('should not terminate the bot if the user is not an admin', async () => {
        checkRoles.mockResolvedValue({ role: 'user' });
        responseMessages.noPermission = 'You do not have permission to terminate the bot';

        await handleBotTermination(client, message);

        expect(client.getChatById).toHaveBeenCalledWith(message.from);
        const chat = await client.getChatById(message.from);
        expect(chat.sendSeen).toHaveBeenCalled();
        expect(chat.sendStateTyping).toHaveBeenCalled();
        
        expect(checkRoles).toHaveBeenCalledWith(message.author);
        expect(logger.warn).toHaveBeenCalledWith('Bot termination requested by non-admin.');
        expect(message.reply).toHaveBeenCalledWith(responseMessages.noPermission);
        expect(client.logout).not.toHaveBeenCalled();
        expect(process.exit).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
        const error = new Error('Test error');
        client.getChatById.mockRejectedValue(error);

        await handleBotTermination(client, message);

        expect(logger.error).toHaveBeenCalledWith('Error in handleBotTermination:', error);
        expect(message.reply).toHaveBeenCalledWith('Error terminating bot');
    });
});