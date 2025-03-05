const { Ollama } = require('ollama');
const axios = require('axios');
require('dotenv').config();
class ollamaModel {
    static async sendPrompt(text) {
        const response = await axios.post(
          `${process.env.OLLAMA_HOST}/api/generate`,
          { model: "llama3.1", prompt: text, stream: false }
        );
        return response.data.response;
    }

    static async isServerRunning() {
      try {
          const response = await axios.get(`${process.env.OLLAMA_HOST}`, {
            timeout: 5000,
            signal: AbortSignal.timeout(5000)
        });
          return response.status === 200;
      } catch (error) {
          return false;
      }
  }
}

module.exports = { ollamaModel };