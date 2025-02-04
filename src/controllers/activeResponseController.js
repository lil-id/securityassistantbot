const { Router } = require('express');

const wazuhRouter = Router();

// Webhook endpoint
function setupActiveResponseRoutes(client, groups) {
    wazuhRouter.post('/alerts', async (req, res) => {
        try {
            const alert = req.body;

            if (alert.length !== 0) {
                // Send message to WhatsApp group
                await client.sendMessage(groups.announcement, 
                    `🖥️ *Agent*: ${alert.agent.name}\n` +
                    `📝 *Description*: ${alert.rule.description}\n` + 
                    `🔔 *Rule Level*: ${alert.rule.level}\n` +
                    `🕒 *Timestamp*: ${alert.timestamp}\n` +
                    `🌐 *Src IP*: ${alert.data.srcip}\n` +
                    `🏷️ *Groups*: ${alert.rule.groups}\n` +
                    `📋 *Full Log*: ${alert.full_log}\n`
                );
                res.status(200).json({ status: 'Alert received successfully' });
            } else {
                console.warn('Alert content is undefined or null');
                res.status(400).json({ error: 'Alert content is missing' });
            }
        } catch (error) {
            console.error('Error processing alert:', error);
            res.status(500).json({ error: 'Error processing alert' });
        }
    });

    return wazuhRouter;
}

// Root endpoint for testing
wazuhRouter.get('/', (req, res) => {
    res.send('Wazuh webhook receiver is running!');
});

async function handleActiveResponse(client, message, args) {
    message.reply("No active response available");
    return;
}

module.exports = { handleActiveResponse, setupActiveResponseRoutes };