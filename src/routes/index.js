const { Router } = require('express');
const { setWazuhWebhookRoutes } = require('./wazuh');
const { setAuthRoutes } = require('./auth');

const routes = (app, client, groups) => {
    const v1 = Router();
    setWazuhWebhookRoutes(v1, client, groups);
    setAuthRoutes(v1);

    app.use('/api/v1', v1);
}

module.exports = routes;