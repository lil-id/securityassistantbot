const { setupActiveResponseRoutes } = require('../controllers/activeResponseController');

const setWazuhWebhookRoutes = (router, client, groups) => {
    router.use('/wazuh', setupActiveResponseRoutes(client, groups));
};

module.exports = { setWazuhWebhookRoutes };