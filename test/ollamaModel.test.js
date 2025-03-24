const { ollamaModel } = require('../src/models/ai/ollamaModel');
const axios = require('axios');

jest.mock('axios');

describe('ollamaModel', () => {
    describe('sendPrompt', () => {
        it('should send a prompt and return the response', async () => {
            const mockResponse = { data: { response: 'mocked response' } };
            axios.post.mockResolvedValue(mockResponse);

            const result = await ollamaModel.sendPrompt('test prompt');
            expect(result).toBe('mocked response');
            expect(axios.post).toHaveBeenCalledWith(
                `${process.env.OLLAMA_HOST}/api/generate`,
                { model: "llama3.1", prompt: 'test prompt', stream: false }
            );
        });
    });

    describe('isServerRunning', () => {
        it('should return true if the server is running', async () => {
            axios.get.mockResolvedValue({ status: 200 });

            const result = await ollamaModel.isServerRunning();
            expect(result).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(`${process.env.OLLAMA_HOST}`, {
                timeout: 5000,
                signal: AbortSignal.timeout(5000)
            });
        });

        it('should return false if the server is not running', async () => {
            axios.get.mockRejectedValue(new Error('Server not running'));

            const result = await ollamaModel.isServerRunning();
            expect(result).toBe(false);
        });
    });
});