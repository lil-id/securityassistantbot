const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Base } = require('whatsapp-web.js');
const { default: ollama } = require('ollama');

// TODO: Install model Ollama using Docker

async function sendCommand(text) {
    const response = await ollama.chat({
      model: 'llama3.1',
      messages: [{ role: 'user', content: text }],
    })
    console.log(response.message.content)
    return response.message.content;
}

// Why is the sky blue?

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    }
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message_create', msg => {
    const result = sendCommand(msg);
    msg.reply(result);
    // if (msg.body == '!ping') {
    //     msg.reply('pong');
    // }
});

client.initialize();
