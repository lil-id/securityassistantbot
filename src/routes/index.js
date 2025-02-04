const { Router } = require('express');

const { setWazuhWebhookRoutes } = require('./wazuh');

const routes = (app, client, groups) => {
    const v1 = Router();
    v1.use('/v1', v1);
    setWazuhWebhookRoutes(v1, client, groups);

    app.use('/api', v1);
}

module.exports = routes;