const { Router } = require('express');
const { setWazuhWebhookRoutes } = require('./wazuh');
const { setOllamaRoutes } = require('./ollama');
const { setAuthRoutes } = require('./auth');

const routes = (app, client, groups, io) => {
    const v1 = Router();
    setWazuhWebhookRoutes(v1, client, groups, io);
    setOllamaRoutes(v1);
    setAuthRoutes(v1);

    app.use('/api/v1', v1);
}

module.exports = routes;