const { setupActiveResponseRoutes } = require('../controllers/activeResponseController');

const setWazuhWebhookRoutes = (router, client, groups, io) => {
    router.use('/wazuh', setupActiveResponseRoutes(client, groups, io));
};

module.exports = { setWazuhWebhookRoutes };