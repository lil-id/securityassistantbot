const { Ollama } = require('ollama');
const axios = require('axios');
require('dotenv').config();
class ollamaModel {
    static async sendPrompt(text) {
        const ollama = new Ollama({ host: process.env.OLLAMA_HOST });
        const response = await ollama.chat({
          model: 'llama3.2:3b-instruct-q8_0',
          messages: [{ role: 'user', content: text }],
        })
        return response.message.content;
    }
}

module.exports = { ollamaModel };